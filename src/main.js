function start() {
    const dsc = require('discord.js');
    const { REST } = require('@discordjs/rest');
    const { Routes } = require('discord-api-types/v9');
    const { Logging } = require('./Logging.ts');
    const va_b = require('./VA_Basic.ts');
    const check_va = require('./check-va.ts');
    const leaderboard = require('./leaderboard.ts');
    const json = require('./JSON_Funcs.ts');

    const startup = require('./_start.js');


    // Client
    const bot = new dsc.Client({ intents: [dsc.Intents.FLAGS.GUILD_MESSAGES, dsc.Intents.FLAGS.GUILDS, dsc.Intents.FLAGS.GUILD_MEMBERS, dsc.Intents.FLAGS.GUILD_VOICE_STATES] })


    // On-Ready
    bot.once('ready', async c => {
        Logging.log('VoiceActivity started');
        
        const rest = new REST({ version: '9' }).setToken(json.read(new json.Files().CONFIG, ['t']));
        rest.put(Routes.applicationGuildCommands(c.user.id, json.read(new json.Files().CONFIG, ['guild_id'])), { body: app_interactions })
            .then(() => Logging.debug('App Interactions registered'));
        
        bot.user.setPresence({
            activities: [{ 
                name: "users in the VoiceChannels",
                type: "WATCHING"
            }],
            status: "online"
        }); // APEX_SCHREIBEN_MIT_ISSUES_IN_ABOUT__TODO

        await va_b.check_voice(bot);
    }); 
    bot.once('apiRequest', async (r) => {
        await startup.check_loop(bot);
    });
    

    // Member Join
    bot.on('guildMemberAdd', (m) => {
        va_b.join_warning(json.read(new json.Files().CONFIG, ''), m);
    });


    // Bei Mute, Deafen, Leave oder Join
    bot.on('voiceStateUpdate', va_b.voice_state(bot));


    const app_interactions = [
        {
            guild_id: json.read(new json.Files().CONFIG, ['guild_id']),
            name: 'moderating',
            name_localizations: {
                de: "moderierung"
            },
            description: 'Command Group for Moderating Purposes',
            description_localizations: {
                de: "Command Gruppe für Moderierungs Zwecke"
            },
            options: [{
                name: "check-va",
                description: "Returns the last time a user was in a VC",
                description_localizations: {
                    de: "Gibt den den letzten Zeitpunkt an dem ein User in einem VC war aus"
                },
                type: 1,  // Sub Command
                options: [{
                    type: 6,  // User
                    name: 'user',
                    description: 'The user to check the activity from',
                    description_localizations: {
                        de: "Der User von dem die Aktivität überprüft werden soll"
                    },
                    required: true
                }]
            },
            {
                name: "leaderboard",
                description: "Sends the leaderboard",
                description_localizations: {
                    de: "Sendet die Rangliste"
                },
                type: 1, 
                options: [{
                    type: 3,  // String
                    name: "date_or_all",
                    description: "Enter a date (you get the format from the wiki) or just `all`",
                    description_localizations: {
                        de: "Gib ein Datum (das Format bekommst du im Wiki) oder `all` ein",
                    },
                    required: true
                }]
            }],
            dm_permission: false,
            default_member_permissions: (1 << 13).toString()
        },
        {
            type: 2,
            guild_id: json.read(new json.Files().CONFIG, ['guild_id']),
            name: "Check VoiceActivity",
            name_localizations: {
                de: "VoiceAktivität überprüfen"
            },
            dm_permission: false,
            default_member_permissions: (1 << 13).toString()
        }
    ];

    // LEADERBOARD_IMPLEMENT_MIT_DELETED_ODER_SEITE_FETCHEN__TODO
    // Slash Command & User Context
    bot.on('interactionCreate', async interact => {
        if (interact.isCommand() && interact.commandName.includes("check-va") || interact.isUserContextMenu()) await check_va.respond_check_activity(json.read(new json.Files().CONFIG, ''), interact, true);
        else if (interact.isCommand() && interact.command.includes('leaderboard')) await leaderboard.respond_leaderboard(bot, json.read(new json.Files().CONFIG, ''), interact, true);
        else if (interact.isButton() || interact.isModalSubmit()) await leaderboard.page_scroll(bot, json.read(new json.Files().CONFIG, ''), interact);
    });


    // Message Respond
    bot.on('messageCreate', async msg => {
        if (msg.content.startsWith('_check-va')) await check_va.respond_check_activity(json.read(new json.Files().CONFIG, ''), msg, false);
        else if (msg.content.startsWith('_leaderboard')) await leaderboard.respond_leaderboard(bot, json.read(new json.Files().CONFIG, ''), msg, false);
    });

    // Login
    bot.login(json.read(new json.Files().CONFIG, ['t']));
}
module.exports.start = start;
