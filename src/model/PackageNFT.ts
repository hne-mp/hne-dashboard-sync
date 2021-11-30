import { Sequelize, Model, DataTypes } from "sequelize";

import connection from "../DBConnect";
class PackageNFT extends Model {}
PackageNFT.init(
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
    tx_fee: {
      type: DataTypes.DECIMAL,
    },
    from_address: {
      type: DataTypes.STRING,
    },
    to_address: {
      type: DataTypes.STRING,
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
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "PackageNFT", // We need to choose the model name
    indexes: [
      {
        fields: ["create_time"],
      },
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
        fields: ["address"],
      },

      {
        fields: ["tx_hash", "token_id"],
        unique: true,
      },
    ],
  },
);

export default PackageNFT;
