import { Op } from "sequelize";
import { EventData } from "web3-eth-contract";
import { BURN_ADDRESS, TOPICS } from "../constant";
import { contract_transfer, getWeb3 } from "../contract/contract";
import AscendHistory from "../model/AscendHistory";
import HeroV2 from "../model/Hero.v2";
import TransferHero from "../model/TransferHero";
import { createIfNotExist, updateOrCreate } from "../service/Common.service";
import { send_message } from "../service/Telegram.Bot";
import { TransferHeroService } from "../service/TransferHero.service";
import { logger } from "../utils/logger";
import { threadPool } from "../utils/parallel";
import { BaseJob } from "./base.job";

export class HeroTransferJob extends BaseJob {
  process = async (fromBlock: number, toBlock: number) => {
    logger.debug(`${this.name} begin sync block ${fromBlock} - ${toBlock}`);
    let list_transfer = await contract_transfer().getPastEvents("Transfer", {
      fromBlock,
      toBlock,
      topics: [TOPICS.HEA_TRANSFER],
    });

    logger.debug(`${this.name} ${list_transfer.length} event detected`);
    this.setLatestBlock(fromBlock);

    const issueEvents = list_transfer.filter(
      (e) => e.returnValues.from === BURN_ADDRESS,
    );

    const burnEvents = list_transfer.filter(
      (e) => e.returnValues.to === BURN_ADDRESS,
    );

    const transferEvents = list_transfer.filter(
      (e) =>
        e.returnValues.from !== BURN_ADDRESS &&
        e.returnValues.to !== BURN_ADDRESS,
    );

    await this.processIssued(issueEvents);
    await this.processTransfer(transferEvents);
    await this.processBurn(burnEvents);

    if (list_transfer.length > 0) {
      this.setLatestBlock(
        list_transfer[list_transfer.length - 1].blockNumber + 1,
      );
    }
    logger.debug(
      `${this.name} end sync block ${fromBlock} - ${this.latestBlock()}`,
    );
  };
  processIssued = async (events: EventData[]) => {
    await threadPool(events, async (event: EventData) => {
      const { tokenId, from, to } = event.returnValues;
      logger.debug(`${this.name} issued hero ${tokenId}`);
      const transferDb = await TransferHero.findOne({
        where: {
          tx_hash: event.transactionHash,
          token_id: tokenId,
        },
      });
      if (transferDb) {
        return;
      }
      let issued_heroes;
      const web3 = getWeb3();
      const nftContract = contract_transfer();
      const transaction = await web3.eth.getTransaction(event.transactionHash);
      const tx = await web3.eth.getTransactionReceipt(event.transactionHash);
      const block = await web3.eth.getBlock(event.blockNumber);
      const latestLog = tx.logs[tx.logs.length - 1];
      if (latestLog.topics[0] === TOPICS.SUMMON) {
        const result = web3.eth.abi.decodeParameters(
          ["address", "uint256", "string", "string", "string", "string"],
          latestLog.data,
        );
        issued_heroes = {
          token_id: tokenId,
          type: "SUMMON",
          type_issued: result[5],
        };
      } else {
        issued_heroes = {
          token_id: tokenId,
          type: "OPEN_PACK",
        };
      }
      const hero_data = await nftContract.methods
        .heroesNumber(issued_heroes.token_id)
        .call();
      if (
        issued_heroes.type === "SUMMON" &&
        issued_heroes.type_issued === "Shard"
      ) {
        const heroService = new TransferHeroService();
        const issuedHeroInDay = await heroService.getHeroSummon(
          to,
          hero_data?.tierBasic,
        );
        let msg = null;
        const listToken = issuedHeroInDay.map((h) => h.token_id);
        if (!listToken.includes(tokenId)) {
          listToken.push(tokenId);
        }
        if (hero_data?.tierBasic === "Rare" && listToken.length > 2) {
          msg = `Summon ${
            listToken.length
          } Rare heroes from shard in 24h detected.
            Heroes summon in 24h: ${listToken.join(",")}
            Wallet: [${to}](https://bscscan.com/address/${to})
          `;
        }
        if (hero_data?.tierBasic === "Epic" && listToken.length > 1) {
          msg = `Summon ${
            listToken.length
          } Epic heroes from shard in 24h detected.
            Heroes summon in 24h: ${listToken.join(",")}
            Wallet: [${to}](https://bscscan.com/address/${to})
          `;
        }
        if (msg) {
          logger.info(msg);
          await send_message(msg);
        }
      }
      const transferHistory = {
        token_id: tokenId,
        tx_hash: event.transactionHash,
        from_address: from,
        to_address: to,
        tx_fee: (Number(tx.gasUsed) * Number(transaction.gasPrice)) / 1e18,
        create_time: Number(block.timestamp) * 10 ** 3,
        block_number: event.blockNumber,
      };
      const heroInsert = {
        token_id: issued_heroes.token_id,
        name: hero_data?.name,
        tier: hero_data?.tier,
        tier_basic: hero_data?.tierBasic,
        uri: hero_data?.uri,
        race: hero_data?.race,
        class: hero_data?.class,
        hero_number: hero_data?.heroesNumber,
        is_burned: false,
        type: issued_heroes.type,
        type_issued: issued_heroes?.type_issued,
        owner: to,
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
      };
      await createIfNotExist(
        HeroV2,
        {
          token_id: heroInsert.token_id,
          tx_hash: event.transactionHash,
        },
        heroInsert,
      );
      await createIfNotExist(
        TransferHero,
        {
          token_id: tokenId,
          tx_hash: event.transactionHash,
        },
        transferHistory,
      );
    });
  };

  processTransfer = async (events: EventData[]) => {
    await threadPool(events, async (event: EventData) => {
      const { from, to, tokenId } = event.returnValues;
      logger.debug(`${this.name} update owner of ${tokenId} to ${to}`);
      const transferDb = await TransferHero.findOne({
        where: {
          tx_hash: event.transactionHash,
          token_id: tokenId,
        },
      });
      if (transferDb) {
        return;
      }
      const web3 = getWeb3();
      const transaction = await web3.eth.getTransaction(event.transactionHash);
      const tx = await web3.eth.getTransactionReceipt(event.transactionHash);
      const block = await web3.eth.getBlock(event.blockNumber);
      const transferHistory = {
        token_id: tokenId,
        tx_hash: event.transactionHash,
        from_address: from,
        to_address: to,
        tx_fee: (Number(tx.gasUsed) * Number(transaction.gasPrice)) / 1e18,
        create_time: Number(block.timestamp) * 10 ** 3,
        block_number: event.blockNumber,
        buy_on_mp: false,
      };
      const latestLog = tx.logs[tx.logs.length - 1];
      if (
        latestLog.topics[0] === TOPICS.MATCH_TX ||
        latestLog.topics[0] === TOPICS.MATCH_TX_V2 ||
        latestLog.topics[0] === TOPICS.WISH_ITEM
      ) {
        transferHistory.buy_on_mp = true;
      }
      await updateOrCreate(
        TransferHero,
        {
          token_id: tokenId,
          tx_hash: event.transactionHash,
        },
        transferHistory,
      );
      await HeroV2.update(
        {
          owner: to,
          block_number: event.blockNumber,
        },
        {
          where: {
            token_id: tokenId,
            block_number: {
              [Op.lte]: event.blockNumber,
            },
          },
        },
      );
    });
  };

  processBurn = async (events: EventData[]) => {
    await threadPool(events, async (event: EventData) => {
      const { from, to, tokenId } = event.returnValues;
      logger.debug(`${this.name} burn ${tokenId} `);
      const transferDb = await TransferHero.findOne({
        where: {
          tx_hash: event.transactionHash,
          token_id: tokenId,
        },
      });
      if (transferDb) {
        return;
      }
      const web3 = getWeb3();
      const transaction = await web3.eth.getTransaction(event.transactionHash);
      const tx = await web3.eth.getTransactionReceipt(event.transactionHash);
      const block = await web3.eth.getBlock(event.blockNumber);
      const transferHistory = {
        token_id: tokenId,
        tx_hash: event.transactionHash,
        from_address: from,
        to_address: to,
        tx_fee: (Number(tx.gasUsed) * Number(transaction.gasPrice)) / 1e18,
        create_time: Number(block.timestamp) * 10 ** 3,
        block_number: event.blockNumber,
      };
      await createIfNotExist(
        TransferHero,
        {
          token_id: tokenId,
          tx_hash: event.transactionHash,
        },
        transferHistory,
      );
      await HeroV2.update(
        {
          is_burned: true,
          owner: to,
          block_number: event.blockNumber,
        },
        {
          where: {
            token_id: tokenId,
          },
        },
      );

      //ascend
      const latestLog = tx.logs[tx.logs.length - 1];
      //ascend hero
      if (latestLog.topics[0] === TOPICS.ASCEND_TOPIC) {
        const result = web3.eth.abi.decodeParameters(
          ["address", "uint256", "string"],
          latestLog.data,
        );
        await HeroV2.update(
          {
            tier: result[2],
            block_number: event.blockNumber,
          },
          {
            where: {
              token_id: tokenId,
            },
          },
        );
        const ascend = {
          token_id: result[1],
          tier: result[2],
          tx_hash: event.transactionHash,
          block_number: event.blockNumber,
          timestamp: Number(block.timestamp) * 10 ** 3,
          food: tokenId,
        };
        await createIfNotExist(
          AscendHistory,
          {
            token_id: ascend.token_id,
            tx_hash: event.transactionHash,
            food: ascend.food,
          },
          ascend,
        );
        logger.debug(
          `${this.name} ascend hero ${ascend.token_id} - ${ascend.tier}`,
        );
      }
    });
  };
}
