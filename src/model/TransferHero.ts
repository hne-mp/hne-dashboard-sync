import { Model, DataTypes } from "sequelize";

import connection from "../DBConnect";
class TransferHero extends Model {}
TransferHero.init(
  {
    tx_hash: {
      type: DataTypes.STRING,
    },
    block_number: {
      type: DataTypes.DECIMAL,
    },
    from_address: {
      type: DataTypes.STRING,
    },
    to_address: {
      type: DataTypes.STRING,
    },
    token_id: {
      type: DataTypes.STRING,
    },
    create_time: {
      type: DataTypes.DATE,
    },
    tx_fee: {
      type: DataTypes.DECIMAL,
    },
    buy_on_mp: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "TransferHero", // We need to choose the model name
    indexes: [
      {
        fields: ["block_number"],
      },
      {
        fields: ["from_address"],
      },
      {
        fields: ["to_address"],
      },
      {
        fields: ["create_time"],
      },
      {
        fields: ["buy_on_mp"],
      },
      {
        fields: ["tx_hash", "token_id"],
        unique: true,
      },
    ],
  },
);

export default TransferHero;
