const { Formatters, MessageEmbed } = require('discord.js');
const { Logging } = require('./Logging.ts');
const json = require('./JSON_Funcs.ts');

var l_a, emb, member;


async function respond_check_activity(config, caller, cmd) {
    if (config.moderating_whitelist.includes(caller.member.id)) {
        
        Logging.log(caller.member.displayName+' requested VoiceActivity');

        if (!cmd && caller.content.split('.')[1]) {
            try {
                member = caller.guild.members.cache.get(caller.content.split('.')[1]);
            } catch (e) {
                emb = new MessageEmbed({title: "Wrong User Format", 
                    description: "_check-va.[USER_ID: **[ID](https://flexgamesgithub.github.io/FlexBot/#param-type-id)**] (Website is german)\n[check-va in Wiki](https://github.com/FlexGamesGitHub/VoiceActivity/wiki/THE-COMMANDS#_check-vauser_id-id)", 
                    color: config.danger_color});
                return caller.reply({embeds: [emb]});
            }
            if (!member) {
                emb = new MessageEmbed({title: "Wrong User Format", 
                    description: "_check-va.[USER_ID: **[ID](https://flexgamesgithub.github.io/FlexBot/#param-type-id)**] (Website is german)\n[check-va in Wiki](https://github.com/FlexGamesGitHub/VoiceActivity/wiki/THE-COMMANDS#_check-vauser_id-id)", 
                    color: config.danger_color});
                return caller.reply({embeds: [emb]});
            }
        } 
        else if (cmd) member = caller.targetMember || caller.options.getMember('user');

        else {
            emb = new MessageEmbed({title: "You forgot the user", 
                description: "_check-va.[USER_ID: [ID](https://flexgamesgithub.github.io/FlexBot/#param-type-id)] (Website is german)\n[check-va in Wiki](https://github.com/FlexGamesGitHub/VoiceActivity/wiki/THE-COMMANDS#_check-vauser_id-id)", 
                color: config.danger_color});
            return caller.reply({embeds: [emb]});
        }
        
        if (member.user.bot) {
            emb = new MessageEmbed({title: "User is a bot", color: config.danger_color});
            return caller.reply({embeds: [emb]});
        }

        if ((l_a = json.read(new json.Files().ACTIVITY, [member.id]))) {
            emb = new MessageEmbed({title: "Last seen:", 
                description: `<@${member.id}> was last time at ${Formatters.time(new Date(l_a), 'f')} (measured in ${new Date().getTimezoneOffset() / 60}h from UTC) in a voice channel.`, 
                color: config.success_color});

            Logging.log('Requested VoiceActivity of '+member.displayName+" sent for "+caller.member.displayName);

            caller.reply({embeds: [emb]});
        }
        else {
            emb = new MessageEmbed({title: member.displayName+" hasn't ever been in a voice channel",
                color: config.danger_color});
            caller.reply({embeds: [emb]});
        }
    } else {
        emb = new MessageEmbed({title: "You have no access to this function", color: config.danger_color});
        caller.reply({embeds: [emb]});
    }
}
module.exports.respond_check_activity = respond_check_activity;