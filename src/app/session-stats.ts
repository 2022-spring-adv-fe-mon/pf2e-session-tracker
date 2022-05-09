import { summaryFileName } from "@angular/compiler/src/aot/util";
import { combineLatest } from "rxjs";
import { CombatData, getDuration, RollData, SessionData, CHECKTYPES, RESULTS } from "./session-data";

const OUTLIER_UPPER_THRESHHOLD = 15;
const OUTLIER_LOWER_THRESHHOLD = 5;

// Determines whether a given roll was made during a given combat
function isDuringThisCombat(roll: RollData, combat: CombatData): boolean {
    let rollTime = Date.parse(roll.time)
    if (rollTime > Date.parse(combat.startTime))
        if (rollTime < Date.parse(combat.endTime))
            return true;
    return false;
}

// May be defunct just by sorting the list...
export function calculateMostRecentSession(sessions: SessionData[]): SessionData {
    return sessions.reduce((acc, session) => 
        Date.parse(session.startTime) > Date.parse(acc.startTime) ? session : acc, sessions[0]);
}

export function calculateShortestSession(sessions: SessionData[]): SessionData {
    return sessions.reduce((acc, session) => getDuration(acc) < getDuration(session) ? acc : session, sessions[0]);
}

export function calculateLongestSession(sessions: SessionData[]): SessionData {
    return sessions.reduce((acc, session) => getDuration(acc) > getDuration(session) ? acc : session, sessions[0])
}

export function calculateSessionLongestCombat(session: SessionData): CombatData {
    return session.combats.reduce((acc, combat) =>
        getDuration(combat) > getDuration(acc) ? combat : acc, session.combats[0]);
}



export function calculateAverageSessionTime(sessions: SessionData[]): number {
    let l = sessions.length;
    let sum = calculateTotalSessionTime(sessions);
    return sum / l;
}

export function calculateTotalSessionTime(sessions: SessionData[]): number {
    return sessions.reduce((acc, session) => acc + getDuration(session), 0)
}

// Calculates total time in milliseconds of combat in a given SESSION
export function calculateSessionCombatTime(session: SessionData): number {
    return session.combats.reduce((acc, combat) => acc + getDuration(combat), 0);
}

// Calculates total time in milliseconds of combat of a LIST of sessions
export function calculateTotalCombatTime(sessions: SessionData[]): number {
    return sessions.reduce((acc, session) => acc + calculateSessionCombatTime(session), 0);
}

// Calculates total number of rounds of combat in a session
export function calculateSessionCombatRounds(session: SessionData): number {
    return session.combats.reduce((acc, combat) => acc + combat.rounds, 0);
}

// Calculates total number of rounds of combat in list of sessions
export function calculateTotalCombatRounds(sessions: SessionData[]): number {
    return sessions.reduce((acc, session) => acc + calculateSessionCombatRounds(session), 0);
}

// TODO remove because superfluous?
export function calculateSessionNumberOfRolls(session: SessionData): number {
    return session.rolls.length;
}

// Calculates sum of all rolls given a list of sessions
export function calculateTotalNumberOfRolls(sessions: SessionData[]): number {
    return sessions.reduce((acc, session) => acc + session.rolls.length, 0);
}

// Calculate number of rolls made during combat in a session
export function calculateSessionCombatRolls(session: SessionData): number {
    return session.rolls.reduce((acc, roll) => 
        session.combats.reduce((acc2, combat) => 
            isDuringThisCombat(roll, combat) ? acc2 + 1 : acc2, 0) + acc, 0);
}



export function calculateSessionRollOutliers(session: SessionData): RollData[] {
    return session.rolls.filter((roll) => 
        (roll.checkResult == RESULTS[0] && roll.dieRoll <= OUTLIER_LOWER_THRESHHOLD) ||
        (roll.checkResult == RESULTS[4] && roll.dieRoll >= OUTLIER_UPPER_THRESHHOLD));
}

// TODO make this not an array?
export function findLowestCriticalSuccess(rolls: RollData[]): RollData[] {
    let crits = rolls.filter((roll) => roll.checkResult == RESULTS[0]);
    if (crits.length > 0)
        return [crits.reduce((acc, roll) => 
            roll.dieRoll < acc.dieRoll ? roll : acc, crits[0])];
    else
        return [];
}

// Returns a 4-length array tally of each type of result
export function tallySessionCheckResults(session: SessionData, res=[0,0,0,0]): number[] {
    session.rolls.forEach(roll => res[RESULTS.indexOf(roll.checkResult)]++);
    return res;
}

export function tallyTotalCheckResults(sessions: SessionData[]): number[] {
    let res = [0,0,0,0];
    return sessions.reduce((acc, session) => tallySessionCheckResults(session, acc), res);
}

//creates a map with counts for each type of check made in a session
export function tallySessionCheckTypes(session: SessionData, tallyMap=new Map()) {
    return session.rolls.reduce((acc, roll) => {
        if (acc.has(roll.checkType))
            acc.set(roll.checkType, acc.get(roll.checkType) + 1);
        else
            acc.set(roll.checkType, 1);
        return acc;
    }, tallyMap);
}

//creates a map with counts for each type of check in all sessions
export function tallyTotalCheckTypes(sessions: SessionData[]) {
    return sessions.reduce((acc, session) => tallySessionCheckTypes(session, acc), new Map());
}