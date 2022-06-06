export const APP_NAME = "pf2e-session-tracker";

export function getProfilesFromSessions(sessions: SessionData[]): string[] {
    return [...new Set(sessions.map(session => session.character))];
}

export function getTimestamp(): string {
    let date = new Date().toISOString();
    //date = date.substring(0, date.indexOf("."))
    return date;
}

export function getDuration(o: Timeable) {
    return Date.parse(o.endTime) - Date.parse(o.startTime);
}

export function sinceDate(dateString: string) {
    let today = new Date();
    let date = new Date(dateString);

    let years = today.getFullYear() - date.getFullYear();
    let months = today.getMonth() - date.getMonth();
    if (months < 0 && years > 0) {
        years -= 1;
        months += 12;
    }

    if (years == 1)
        return "1 year ago";
    if (years > 1)
        return years + " years ago";

    if (months > 1)
        return months + " months ago";
    let days = today.getDate() - date.getDate();
    if (months == 1 && days >= 0)
        return "1 month ago";

    let ms = today.getTime() - date.getTime();
    days = Math.floor(ms / 86400000);

    if (days < 14 && days >= 7)
        return "1 week ago";
    if (days >= 14)
        return Math.floor(days/7) + " weeks ago";
    
    if (days == 1)
        return "1 day ago";
    if (days > 1)
        return days + " days ago";

    let hours = Math.floor(ms / 3600000);
    if (hours == 1) 
        return "1 hour ago";
    if (hours > 1)
        return hours + " hours ago";

    let minutes = Math.floor(ms / 60000);
    if (minutes == 1)
        return "1 minute ago";
    if (minutes > 1)
        return minutes + " minutes ago";

    let seconds = Math.floor(ms/1000);

    if (seconds <= 1)
        return "just now";
    
    return seconds + "s ago";
}

export function getFormattedDurationOf (o: Timeable): string {
    let duration = Date.parse(o.endTime) - Date.parse(o.startTime);
    return getFormattedDuration(duration);
}

export function getFormattedDuration(duration: number): string {
    let durationString = "";
    let ms = duration;
    let days = Math.floor(ms/86400000);
    ms = ms%86400000;
    let hours = Math.floor(ms/3600000);
    ms = ms%3600000;
    let minutes = Math.floor(ms/60000);
    ms = ms%60000;
    let seconds = Math.floor(ms/1000);

    if (days == 1)
        durationString += days + " day ";
    else if (days > 1)
        durationString += days + " days ";

    durationString += hours + ":";
    if (minutes < 10)
        durationString += "0";
    durationString += minutes + ":";
    if (seconds < 10)
        durationString += "0";
    durationString += seconds;
    return durationString;
}

interface Timeable {
    startTime: string;
    endTime: string;
}

export interface SessionData extends Timeable {
    character: string; // player character's name
    startTime: string;  //"YYYY-MM-DDTHH-MM-SS"
    endTime: string;  //"YYYY-MM-DDTHH-MM-SS"
    combats: CombatData[];
    rolls: RollData[];
}

export interface CombatData extends Timeable {
    startTime: string;
    endTime: string;
    rounds: number; // can still be 0, meaning combat ended before you got a turn
}

export interface RollData {
    time: string; // "YYYY-MM-DDTHH-MM-SS" (can track stats of how many rolls per hour this way)
    dieRoll: number; // on the die, (between 1 and 20)
    checkResult: string; // "critical success"|"success"|"failure"|"critical failure"
//  checkResult: number; 0,1,2,3 ["critical success", "success", "failure", "critical failure"]
    checkType: string; //enum?? acrobatics, athletics,
}

export const CHECKTYPES: string[] = [
    'Attack Roll',
    'Fortitude Save', 
    'Will Save', 
    'Reflex Save',
    'Flat Check',
    'Acrobatics',
    'Arcana',
    'Athletics',
    'Crafting',
    'Deception',
    'Diplomacy',
    'Intimidation',
    'Lore',
    'Medicine',
    'Nature',
    'Occultism',
    'Performance',
    'Religion',
    'Society',
    'Stealth',
    'Survival',
    'Thievery',
    'Other'
];


// TODO change to object?  RESULTS.CRIT_SUCCESS, RESULTS.SUCCESS
export const RESULTS: string[] = [
    'Critical Success', 'Success', 'Failure', 'Critical Failure'
];

//const groupRollsByCheckType = (sessions: SessionData[]) => {
//    sessions.reduce(
//        (acc, x) => {
//            x.rolls.forEach(y => acc.set(
//                y.checkType,
//                [... (acc.get(y.checkType) ?? []), x]
//            ))
//            return acc;
//        },
//        new Map<string, RollData[]>()
//
//    )
//}