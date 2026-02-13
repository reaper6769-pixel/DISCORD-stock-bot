// ===== EXPRESS SERVER (FOR RENDER PORT) =====
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is online ✅');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ===== DISCORD BOT CODE BELOW =====
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1471159669136298014';       // Your Application ID
const GUILD_ID = '1471072212621725698';        // Your Server ID
const ALLOWED_CHANNEL = '1471186041216962582'; // Channel where /gen is allowed

// ===== CREATE CLIENT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== SLASH COMMANDS =====
const commands = [
  new SlashCommandBuilder()
    .setName('gen')
    .setDescription('Generate an account from stock')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('stock')
    .setDescription('Check remaining stock')
    .toJSON()
];

// ===== REGISTER COMMANDS =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Commands registered.");
  } catch (err) {
    console.error(err);
  }
})();

// ===== COOLDOWN SYSTEM =====
const cooldown = new Set();

// ===== COMMAND HANDLER =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ===== STOCK COMMAND =====
  if (interaction.commandName === 'stock') {
    try {
      const stock = fs.readFileSync('./stock.txt', 'utf8')
        .split('\n')
        .filter(x => x.trim() !== '');

      return interaction.reply(`📦 Stock remaining: **${stock.length}**`);
    } catch (err) {
      console.error(err);
      return interaction.reply("❌ Could not read stock file.");
    }
  }

  // ===== GEN COMMAND =====
  if (interaction.commandName === 'gen') {

    // Channel restriction
    if (interaction.channel.id !== ALLOWED_CHANNEL) {
      return interaction.reply({
        content: "❌ You can only use this command in the gen channel!",
        ephemeral: true
      });
    }

    // Cooldown check
    if (cooldown.has(interaction.user.id)) {
      return interaction.reply({
        content: "⏳ Please wait 2 minutes before using this command again.",
        ephemeral: true
      });
    }

    cooldown.add(interaction.user.id);
    setTimeout(() => cooldown.delete(interaction.user.id), 120000); // 2 mins

    await interaction.deferReply({ ephemeral: true });

    try {
      let stock = fs.readFileSync('./stock.txt', 'utf8')
        .split('\n')
        .filter(x => x.trim() !== '');

      if (stock.length === 0) {
        return interaction.editReply("❌ No stock available.");
      }

      const account = stock.shift();
      fs.writeFileSync('./stock.txt', stock.join('\n'));

      await interaction.user.send(`🎁 Here is your account:\n\`${account}\``);

      await interaction.editReply("✅ Check your DM!");

    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ Something went wrong.");
    }
  }
});

// ===== LOGIN =====
client.login(TOKEN);
