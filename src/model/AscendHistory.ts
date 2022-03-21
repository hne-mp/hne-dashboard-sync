import { Model, DataTypes } from "sequelize";

import connection from "../DBConnect";
class AscendHistory extends Model {}
AscendHistory.init(
  {
    token_id: {
      type: DataTypes.STRING,
    },
    tier: {
      type: DataTypes.STRING,
    },
    tx_hash: {
      type: DataTypes.STRING,
    },
    food: {
      type: DataTypes.STRING,
    },
    timestamp: {
      type: DataTypes.DATE,
    },
    block_number: {
      type: DataTypes.INTEGER,
    },
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "AscendHistory", // We need to choose the model name
    indexes: [
      {
        fields: ["token_id", "tx_hash", "food"],
        unique: true,
      },
    ],
  },
);

export default AscendHistory;
