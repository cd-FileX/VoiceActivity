const dsc = require('discord.js');
const { Logging } = require('./Logging.ts');
const json = require('./JSON_Funcs.ts');


var member, m_leave_emb, m_join_emb, active_time, m_activity_emb, m_nouser_emb, m_never_voice_emb, no_mod_emb, d, x, l_a,
    voice_activity = {};


async function check_voice(bot) {
    while(true) {
        for (member in voice_activity) if (!voice_activity[member].muted) voice_activity[member].time++;

        await sleep(60000);
    }
}
module.exports.check_voice = check_voice;


function voice_state(bot) {
    return async (o, n) => {
        var config = json.read(new json.Files().CONFIG, '');
        
        if (!o.channelId || bot.guilds.cache.get(json.read(new json.Files().CONFIG, ['guild_id'])).afkChannelId == o.channel.id) {
            Logging.debug(n.member.displayName+" joined a VC");
            voice_activity[n.member.id] = { time: 0, muted: null };
        }

        else if (!n.channelId || bot.guilds.cache.get(json.read(new json.Files().CONFIG, ['guild_id'])).afkChannelId == n.channel.id) {
            Logging.debug(o.member.displayName+" left a VC");

            if (voice_activity[n.member.id] && voice_activity[n.member.id].time > 5) {
                m_leave_emb = new dsc.MessageEmbed({title: 'Member Activity', 
                    description: `<@${n.member.id}> was ${voice_activity[n.member.id].time}mins in a Voice Channel`,
                    color: config.bot_color});
        
                (await bot.channels.fetch(config.log_channel_id)).send({embeds: [m_leave_emb]});

                json.write(new json.Files().ACTIVITY, [o.member.id], new Date());
            }
            delete voice_activity[n.member.id];
        }
 
        if ((n.mute || n.deaf) && !(o.mute || o.deaf)) {  // Remove?
            Logging.debug(n.member.displayName+" has muted - VA stopped");
            voice_activity[n.member.id] ? voice_activity[n.member.id].muted = true : voice_activity[n.member.id] = { time: 0, muted: true };
        }
        else if (!(n.mute || n.deaf) && (o.mute || o.deaf)) {
            Logging.debug(n.member.displayName+" has unmuted - VA started");
            voice_activity[n.member.id] ? voice_activity[n.member.id].muted = false : voice_activity[n.member.id] = { time: 0, muted: false };
        }
    }
}
module.exports.voice_state = voice_state;


function join_warning(config, member) {
    Logging.debug('Measuring warning sent to '+member.displayName);
    m_join_emb = new dsc.MessageEmbed({title: "Warning", 
        description: `**I am active in the server you just joined (${member.guild.name})**\n> This means I am **measuring all activity** of users in a VoiceChannel and sending it to the set server admins **logging channel**.\nAlso your last activity time is saved.`,
        color: config.warning_color})

    member.send({embeds: [m_join_emb]});
}
module.exports.join_warning = join_warning;


async function respond_check_activity(config, caller, cmd) {
    if (cmd && config.moderating_whitelist.includes(caller.user.id) || config.moderating_whitelist.includes(caller.author.id)) {
        
        Logging.log(caller.member.displayName+' requested VoiceActivity');

        if (!cmd && caller.content.split('.')[1]) {
            try {
                member = caller.guild.members.cache.get(caller.content.split('.')[1]);
            } catch (e) {
                m_nouser_emb = new dsc.MessageEmbed({title: "Wrong User Format", 
                    description: "_check-va.[USER_**ID**]", 
                    color: config.danger_color});
                return cmd ? caller.reply({embeds: [m_nouser_emb]}) : caller.channel.send({embeds: [m_nouser_emb]});
            }
            if (!member) {
                m_nouser_emb = new dsc.MessageEmbed({title: "Wrong User Format", 
                    description: "_check-va.[USER_**ID**]", 
                    color: config.danger_color});
                return cmd ? caller.reply({embeds: [m_nouser_emb]}) : caller.channel.send({embeds: [m_nouser_emb]});
            }
        } 
        else if (cmd) member = caller.targetMember;

        else {
            m_nouser_emb = new dsc.MessageEmbed({title: "You forgot the user", 
                description: "_check-va.[USER_ID]", 
                color: config.danger_color});
            return cmd ? caller.reply({embeds: [m_nouser_emb]}) : caller.channel.send({embeds: [m_nouser_emb]});
        }

        if ((l_a = json.read(new json.Files().ACTIVITY, [member.id]))) {
            m_activity_emb = new dsc.MessageEmbed({title: "Last seen:", 
                description: `<@${member.id}> was last time at ${dsc.Formatters.time(new Date(l_a), 'f')} (measured in ${new Date().getTimezoneOffset() / 60}h from UTC) in a voice channel.`, 
                color: config.success_color});

            Logging.log('Requested VoiceActivity of '+member.displayName+" sent for "+caller.member.displayName);

            cmd ? caller.reply({embeds: [m_activity_emb]}) : caller.channel.send({embeds: [m_activity_emb]});
        }
        else {
            m_never_voice_emb = new dsc.MessageEmbed({title: member.displayName+" hasn't ever been in a voice channel",
                color: config.danger_color});
            cmd ? caller.reply({embeds: [m_never_voice_emb]}) : caller.channel.send({embeds: [m_never_voice_emb]});
        }
    } else {
        no_mod_emb = new dsc.MessageEmbed({title: "You have no access to this function", color: config.danger_color});
        cmd ? caller.reply({embeds: [no_mod_emb]}) : caller.channel.send({embeds: [no_mod_emb]});
    }
}
module.exports.respond_check_activity = respond_check_activity;


const sleep = ms => new Promise(r => setTimeout(r, ms));
