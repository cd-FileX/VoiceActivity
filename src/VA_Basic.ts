const { MessageEmbed } = require('discord.js');
const { Logging } = require('./Logging.ts');
const json = require('./JSON_Funcs.ts');


var member, emb, e_time, leaderboard, i,
    voice_activity = {};


async function check_voice() {
    while(true) {
        for (member in voice_activity) {
            if (!voice_activity[member].muted.status) {voice_activity[member].time++}
            else {voice_activity[member.muted.time++]};
        }
        if (!(leaderboard = json.read(new json.Files().BOARD, '')).hasOwnProperty(new Date().toDateString())) json.write(new json.Files().BOARD, [new Date().toDateString()], []);
        for (var date in leaderboard) {
            if ((new Date(date).getTime() - new Date().getTime()) / 86400000 < -7) {  // 86400000ms = 1d
                delete leaderboard[date]; 
                json.write(new json.Files().BOARD, '', leaderboard);
                break;
            }
        }
        Logging.debug('VoiceCheck Tick executed');
        await sleep(60000);
    }
}
module.exports.check_voice = check_voice;


function voice_state(bot) {
    return async (o, n) => {
        var config = json.read(new json.Files().CONFIG, '');
        
        if ((!o.channelId || (await (await bot.guilds.fetch(json.read(new json.Files().CONFIG, ['guild_id']))).fetch()).afkChannelId == o.channel.id) && !o.member.user.bot) {
            Logging.debug(n.member.displayName+" joined a VC");
            voice_activity[n.member.id] = { time: 0, muted: {status: null, time: 0} };
        }

        else if ((!n.channelId || (await (await bot.guilds.fetch(json.read(new json.Files().CONFIG, ['guild_id']))).fetch()).afkChannelId == n.channel.id) && !n.member.user.bot) {
            Logging.debug(o.member.displayName+" left a VC");

            if (voice_activity[n.member.id] && voice_activity[n.member.id].time > 5) {
                var date = new Date().toDateString();
                emb = new MessageEmbed({title: 'Member Activity', 
                    description: `<@${n.member.id}> was ${voice_activity[n.member.id].time}mins in a Voice Channel`,
                    color: config.bot_color});
        
                (await bot.channels.fetch(config.log_channel_id)).send({embeds: [emb]});

                json.write(new json.Files().ACTIVITY, [o.member.id], new Date());
                
                for (i = 0; i < (leaderboard = json.read(new json.Files().BOARD, [date])).length; i++) if (leaderboard[i].id == o.member.id) {
                    json.write(new json.Files().BOARD, [date, i, 'time'], json.read(new json.Files().BOARD, [date, i, 'time'])+voice_activity[o.member.id].time);
                    json.write(new json.Files().BOARD, [date, i, 'muted'], json.read(new json.Files().BOARD, [date, i, 'muted'])+voice_activity[o.member.id].muted.time);
                    return delete voice_activity[n.member.id];
                }
                json.append(new json.Files().BOARD, [date], { id: o.member.id, time: voice_activity[o.member.id].time, muted: voice_activity[o.member.id].muted.time });
            }
            delete voice_activity[n.member.id];
        }
 
        if (((n.mute || n.deaf) && !(o.mute || o.deaf)) && !n.member.user.bot) {
            Logging.debug(n.member.displayName+" has muted - VA stopped");
            voice_activity[n.member.id] ? voice_activity[n.member.id].muted = true : voice_activity[n.member.id] = { time: 0, muted: {status: true, time: 0} };
        }
        else if ((!(n.mute || n.deaf) && (o.mute || o.deaf)) && !n.member.user.bot) {
            Logging.debug(n.member.displayName+" has unmuted - VA started");
            voice_activity[n.member.id] ? voice_activity[n.member.id].muted = false : voice_activity[n.member.id] = { time: 0, muted: {status: false, time: 0} };
        }
    }
}
module.exports.voice_state = voice_state;


function join_warning(config, member) {
    if (member.user.bot) return;
    Logging.debug('Measuring warning sent to '+member.displayName);
    emb = new MessageEmbed({title: "Warning", 
        description: `**I am active in the server you just joined (${member.guild.name})**\n> This means I am **measuring all activity** of users in a VoiceChannel and sending it to the set server admins **logging channel**.\nAlso your last activity time and the time (for 7 days) is saved.`,
        color: config.warning_color})

    member.send({embeds: [emb]});
}
module.exports.join_warning = join_warning;


const sleep = ms => new Promise(r => setTimeout(r, ms));
