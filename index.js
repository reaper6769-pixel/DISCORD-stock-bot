const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

console.log("Token is:", process.env.TOKEN);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Slash command
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

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Register commands
(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        "1471159669136298014", 
        "1471072212621725698"  
      ), 
      { body: commands }
    );

    console.log("Commands registered.");
  } catch (err) {
    console.error(err);
  }
})();

// Cooldown
const cooldown = new Set();

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // STOCK CHECK
  if (interaction.commandName === 'stock') {
    const stock = fs.readFileSync('./stock.txt', 'utf-8').split('\n').filter(x => x);
    return interaction.reply(`📦 Stock remaining: **${stock.length}**`);
  }

  // GENERATE
  if (interaction.commandName === 'gen') {

    const allowedChannel = '1471186041216962582';

    if (interaction.channel.id !== allowedChannel) {
      return interaction.reply({
        content: "❌ You can only use this command in the gen channel!",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const stock = fs.readFileSync('./stock.txt', 'utf8')
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
}); // <-- THIS CLOSES client.on

// LOGIN BOT
client.login(process.env.TOKEN);
