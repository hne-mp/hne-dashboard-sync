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
      type: DataTypes.STRING(25),
    },
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "HotWalletTransfer", // We need to choose the model name
    indexes: [
      {
        fields: ["block_number"],
      },
      {
        fields: ["from_address"],
      },
      {
        fields: ["create_time"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["tx_hash", "to_address"],
        unique: true,
      },
    ],
  },
);

export default HotWalletTransfer;
