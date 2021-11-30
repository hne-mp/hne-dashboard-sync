import { Model, DataTypes } from "sequelize";

import connection from "../DBConnect";
class HeroV2 extends Model {}
HeroV2.init(
  {
    token_id: {
      type: DataTypes.STRING,
    },
    hero_number: {
      type: DataTypes.DECIMAL,
    },
    name: {
      type: DataTypes.STRING,
    },
    race: {
      type: DataTypes.STRING,
    },
    class: {
      type: DataTypes.STRING,
    },
    tier: {
      type: DataTypes.STRING,
    },
    tier_basic: {
      type: DataTypes.STRING,
    },
    uri: {
      type: DataTypes.STRING,
    },
    is_burned: {
      type: DataTypes.BOOLEAN,
    },
    type: {
      type: DataTypes.STRING(20),
    },
    type_issued: {
      type: DataTypes.STRING(20),
    },
    owner: {
      type: DataTypes.STRING,
    },
    tx_hash: {
      type: DataTypes.STRING,
    },
    block_number: {
      type: DataTypes.DECIMAL,
    },
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "HeroV2", // We need to choose the model name
    indexes: [
      {
        fields: ["hero_number"],
      },
      {
        fields: ["name"],
      },
      {
        fields: ["race"],
      },
      {
        fields: ["tier"],
      },
      {
        fields: ["tier_basic"],
      },
      {
        fields: ["class"],
      },
      {
        fields: ["is_burned"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["type_issued"],
      },
      {
        fields: ["owner"],
      },
      {
        fields: ["block_number"],
      },

      {
        fields: ["token_id", "tx_hash"],
        unique: true,
      },
    ],
  },
);

export default HeroV2;
