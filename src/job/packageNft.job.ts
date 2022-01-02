import { EventData } from "web3-eth-contract";
import { BURN_ADDRESS } from "../constant";
import { contract_pack_nft, getWeb3 } from "../contract/contract";
import PackageNFT from "../model/PackageNFT";
import { createIfNotExist } from "../service/Common.service";
import { logger } from "../utils/logger";
import { threadPool } from "../utils/parallel";
import { BaseJob } from "./base.job";

export class PackageNftJob extends BaseJob {
  process = async (fromBlock: number, toBlock: number) => {
    logger.debug(`${this.name} begin sync block ${fromBlock} - ${toBlock}`);
    let list_transfer = await contract_pack_nft().getPastEvents("Transfer", {
      fromBlock,
      toBlock,
    });
    logger.debug(`${this.name} ${list_transfer.length} detected`);
    this.setLatestBlock(fromBlock);
    await threadPool(list_transfer, this.processTransfer);
    if (list_transfer.length > 0) {
      this.setLatestBlock(
        list_transfer[list_transfer.length - 1].blockNumber + 1,
      );
    }
    logger.debug(
      `${this.name} end sync block ${fromBlock} - ${this.latestBlock()}`,
    );
  };
  processTransfer = async (transfer: EventData) => {
    const return_value = transfer.returnValues;
    logger.debug(
      `${this.name} transfer ${return_value.tokenId} from ${return_value.from} to ${return_value.to}`,
    );
    if (
      return_value.from === BURN_ADDRESS ||
      return_value.to === BURN_ADDRESS
    ) {
      const web3 = getWeb3();
      const transaction = await web3.eth.getTransaction(
        transfer.transactionHash,
      );
      const tx = await web3.eth.getTransactionReceipt(transfer.transactionHash);
      const block = await web3.eth.getBlock(transfer.blockNumber);
      let price = 0;
      if (return_value.from === BURN_ADDRESS) {
        const firstLog = tx.logs[0];
        price = Number(web3.utils.fromWei(firstLog.data));
      }
      let obj = {
        token_id: return_value.tokenId,
        tx_hash: transfer.transactionHash,
        create_time: Number(block.timestamp) * 10 ** 3,
        block_number: transfer.blockNumber,
        price: price,
        from_address: return_value.from,
        to_address: return_value.to,
        tx_fee: (Number(tx.gasUsed) * Number(transaction.gasPrice)) / 1e18,
        address: transfer.address,
      };
      await createIfNotExist(
        PackageNFT,
        {
          token_id: return_value.tokenId,
          tx_hash: transfer.transactionHash,
        },
        obj,
      );
    }
  };
}
