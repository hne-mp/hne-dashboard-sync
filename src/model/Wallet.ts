import { Model, DataTypes } from "sequelize";

import connection from "../DBConnect";
class Wallet extends Model {}
Wallet.init(
  {
    address: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    he_amount: {
      type: DataTypes.DECIMAL,
    },
    nft_hero: {
      type: DataTypes.DECIMAL,
    },
    nft_pack: {
      type: DataTypes.DECIMAL,
    },
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "Wallet", // We need to choose the model name
    indexes: [
      {
        fields: ["he_amount", "nft_hero", "nft_pack"],
      },
    ],
  },
);

export default Wallet;
