import { Sequelize, Model, DataTypes } from "sequelize";

import connection from "../DBConnect";
class HotWalletTransfer extends Model {}
HotWalletTransfer.init(
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
    tx_fee: {
      type: DataTypes.DECIMAL,
    },
    amount: {
      type: DataTypes.DECIMAL,
    },
    create_time: {
      type: DataTypes.DATE,
    },
    address: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING(20),
    },
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "HotWalletTransfer", // We need to choose the model name
    indexes: [
      {
        fields: [
          "tx_hash",
          "block_number",
          "from_address",
          "to_address",
          "create_time",
          "type",
        ],
      },
      {
        fields: ["tx_hash", "to_address"],
        unique: true,
      },
    ],
  },
);

export default HotWalletTransfer;
