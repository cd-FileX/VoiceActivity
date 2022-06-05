const { MessageEmbed } = require('discord.js');
const { Logging } = require('./Logging.ts');
const json = require('./JSON_Funcs.ts');


var member, emb, e_time, leaderboard,
    voice_activity = {};


async function check_voice(bot) {
    while(true) {
        for (member in voice_activity) {
            if (!voice_activity[member].muted.status) {voice_activity[member].time++}
            else {voice_activity[member.muted.time++]};
        }
        if (!(new Date().toDateString() in (leaderboard = json.read(new json.Files().BOARD, '')))) json.write(new json.Files().BOARD, [new Date().toDateString()], []);
        for (var date in leaderboard) {
            if ((new Date(date).getTime() - new Date().getTime()) / 86400000 == 7) {  // 86400000ms = 1d
                delete leaderboard[date]; 
                json.write(new json.Files().BOARD, '', leaderboard);
                break;
            }
        }

        await sleep(60000);
    }
}
module.exports.check_voice = check_voice;


function voice_state(bot) {
    return async (o, n) => {
        var config = json.read(new json.Files().CONFIG, '');
        
        if (!o.channelId || bot.guilds.cache.get(json.read(new json.Files().CONFIG, ['guild_id'])).afkChannelId == o.channel.id) {
            Logging.debug(n.member.displayName+" joined a VC");
            voice_activity[n.member.id] = { time: 0, muted: {status: null, time: 0} };
        }

        else if (!n.channelId || bot.guilds.cache.get(json.read(new json.Files().CONFIG, ['guild_id'])).afkChannelId == n.channel.id) {
            Logging.debug(o.member.displayName+" left a VC");

            if (voice_activity[n.member.id] && voice_activity[n.member.id].time > 5) {
                emb = new MessageEmbed({title: 'Member Activity', 
                    description: `<@${n.member.id}> was ${voice_activity[n.member.id].time}mins in a Voice Channel`,
                    color: config.bot_color});
        
                (await bot.channels.fetch(config.log_channel_id)).send({embeds: [emb]});

                json.write(new json.Files().ACTIVITY, [o.member.id, 'last'], new Date());
                json.write(new json.Files().ACTIVITY, [o.member.id, 'time', new Date().toDateString()], 
                    (e_time = json.read(new json.Files().ACTIVITY, [o.member.id, 'time', new Date().toDateString()])) ? e_time + voice_activity[n.member.id].time : voice_activity[n.member.id].time);
                
                json.append(new json.Files().BOARD, [new Date().toDateString()], { id: o.member.id, time: voice_activity[o.member.id].time, muted: voice_activity[o.member.id].muted.time });
            }
            delete voice_activity[n.member.id];
        }
 
        if ((n.mute || n.deaf) && !(o.mute || o.deaf)) {
            Logging.debug(n.member.displayName+" has muted - VA stopped");
            voice_activity[n.member.id] ? voice_activity[n.member.id].muted = true : voice_activity[n.member.id] = { time: 0, muted: {status: true, time: 0} };
        }
        else if (!(n.mute || n.deaf) && (o.mute || o.deaf)) {
            Logging.debug(n.member.displayName+" has unmuted - VA started");
            voice_activity[n.member.id] ? voice_activity[n.member.id].muted = false : voice_activity[n.member.id] = { time: 0, muted: {status: false, time: 0} };
        }
    }
}
module.exports.voice_state = voice_state;


function join_warning(config, member) {
    Logging.debug('Measuring warning sent to '+member.displayName);
    emb = new MessageEmbed({title: "Warning", 
        description: `**I am active in the server you just joined (${member.guild.name})**\n> This means I am **measuring all activity** of users in a VoiceChannel and sending it to the set server admins **logging channel**.\nAlso your last activity time and the time (for 7 days) is saved.`,
        color: config.warning_color})

    member.send({embeds: [emb]});
}
module.exports.join_warning = join_warning;


const sleep = ms => new Promise(r => setTimeout(r, ms));
