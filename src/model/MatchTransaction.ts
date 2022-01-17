import { Sequelize, Model, DataTypes } from "sequelize";

import connection from "../DBConnect";
class MatchTransaction extends Model {}
MatchTransaction.init(
  {
    token_id: {
      type: DataTypes.STRING,
    },
    tx_hash: {
      type: DataTypes.STRING,
    },
    price: {
      type: DataTypes.DECIMAL,
    },
    payment_token: {
      type: DataTypes.STRING,
    },
    seller: {
      type: DataTypes.STRING,
    },
    buyer: {
      type: DataTypes.STRING,
    },
    market_fee: {
      type: DataTypes.DECIMAL,
    },
    create_time: {
      type: DataTypes.DATE,
    },
    block_number: {
      type: DataTypes.DECIMAL,
    },
    address: {
      type: DataTypes.STRING,
    },
    hero_number: {
      type: DataTypes.STRING,
    },

    hero_name: {
      type: DataTypes.STRING,
    },
    hero_race: {
      type: DataTypes.STRING,
    },
    hero_tier: {
      type: DataTypes.STRING,
    },
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "MatchTransactionV2", // We need to choose the model name
    indexes: [
      {
        fields: ["block_number"],
      },
      {
        fields: ["create_time"],
      },
      {
        fields: ["payment_token"],
      },
      {
        fields: ["address"],
      },
      {
        fields: ["hero_number"],
      },
      {
        fields: ["hero_tier"],
      },
      {
        fields: ["tx_hash", "token_id", "seller"],
        unique: true,
      },
    ],
  },
);

export default MatchTransaction;
