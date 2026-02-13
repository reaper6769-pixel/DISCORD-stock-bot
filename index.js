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

// ===== DISCORD BOT CODE =====
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

// ====== CONFIG ======
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1471159669136298014';
const GUILD_ID = '1471072212621725698';
const ADMIN_ID = '1359526601905279037';
const ALLOWED_CHANNEL_ID = '1471186041216962582';
// ======================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== SLASH COMMANDS =====
const commands = [
  new SlashCommandBuilder()
    .setName('gen')
    .setDescription('Generate one stock item'),

  new SlashCommandBuilder()
    .setName('stock')
    .setDescription('Check available stock'),

  new SlashCommandBuilder()
    .setName('addstock')
    .setDescription('Add stock (Admin only)')
    .addStringOption(option =>
      option.setName('items')
        .setDescription('Paste multiple lines (one per line)')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('removestock')
    .setDescription('Remove one stock (Admin only)')
].map(cmd => cmd.toJSON());

// ===== REGISTER COMMANDS =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Commands registered successfully.');
  } catch (error) {
    console.error(error);
  }
})();

// ===== INTERACTION HANDLER =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // Restrict to allowed channel
  if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
    return interaction.reply({
      content: "❌ This command can only be used in the allowed channel.",
      ephemeral: true
    });
  }

  // ===== GENERATE STOCK =====
  if (interaction.commandName === 'gen') {

    if (!fs.existsSync('./stock.txt')) {
      return interaction.reply({ content: '❌ No stock file found.', ephemeral: true });
    }

    let data = fs.readFileSync('./stock.txt', 'utf8');
    let lines = data.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      return interaction.reply({ content: '❌ No stock available.', ephemeral: true });
    }

    const generated = lines.shift();
    fs.writeFileSync('./stock.txt', lines.join('\n'));

    try {
      await interaction.user.send(`🎁 Your generated account:\n\`${generated}\``);
      return interaction.reply({ content: "✅ Check your DMs!", ephemeral: true });
    } catch {
      return interaction.reply({
        content: "❌ I can't DM you. Please enable DMs.",
        ephemeral: true
      });
    }
  }

  // ===== CHECK STOCK =====
  if (interaction.commandName === 'stock') {

    if (!fs.existsSync('./stock.txt')) {
      return interaction.reply({ content: '❌ No stock file found.', ephemeral: true });
    }

    const data = fs.readFileSync('./stock.txt', 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');

    return interaction.reply({
      content: `📦 Available stock: ${lines.length}`,
      ephemeral: true
    });
  }

  // ===== ADD STOCK =====
  if (interaction.commandName === 'addstock') {

    if (interaction.user.id !== ADMIN_ID) {
      return interaction.reply({ content: '❌ You are not admin!', ephemeral: true });
    }

    const items = interaction.options.getString('items');
    const stockArray = items.split('\n').filter(line => line.trim() !== '');

    fs.appendFileSync('./stock.txt', stockArray.join('\n') + '\n');

    return interaction.reply({
      content: `✅ Added ${stockArray.length} stock items.`,
      ephemeral: true
    });
  }

  // ===== REMOVE STOCK =====
  if (interaction.commandName === 'removestock') {

    if (interaction.user.id !== ADMIN_ID) {
      return interaction.reply({ content: '❌ You are not admin!', ephemeral: true });
    }

    if (!fs.existsSync('./stock.txt')) {
      return interaction.reply({ content: '❌ No stock file found.', ephemeral: true });
    }

    let data = fs.readFileSync('./stock.txt', 'utf8');
    let lines = data.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      return interaction.reply({ content: '❌ No stock available.', ephemeral: true });
    }

    const removed = lines.shift();
    fs.writeFileSync('./stock.txt', lines.join('\n'));

    return interaction.reply({
      content: `🗑 Removed: \`${removed}\``,
      ephemeral: true
    });
  }
});

// ===== LOGIN =====
client.login(TOKEN);
