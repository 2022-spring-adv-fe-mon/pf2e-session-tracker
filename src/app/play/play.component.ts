import { Component, OnInit } from '@angular/core';
import { CombatData, getTimestamp, RollData, SessionData } from '../session-data';
import { AppService } from '../app.service';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { DiceRollComponent } from '../dice-roll/dice-roll.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {

  loadingData = true;

  character: string = "";
  combats: CombatData[] = [];
  rolls: RollData[] = [];

  inCombat: boolean = false;
  combatStartTime = "";
  combatRounds = 0;

  constructor(private router: Router, private rollDialog: MatDialog, private appService: AppService) {
  }

  ngOnInit(): void {
    this.appService.whenLoaded(() => {
      let activeSession = this.appService.getActiveSession();
      if (activeSession.length > 10) {
        if (activeSession[0].character)
          this.character = activeSession[0].character;
        if (activeSession[0].combats)
          this.combats = activeSession[0].combats;
        if (activeSession[0].rolls)
          this.rolls = activeSession[0].rolls;
        console.log("Continued active session.");
        console.log(activeSession[0]);
      } else {
        this.character = this.appService.getSelectedProfile();
        this.appService.startNewSession();
      }
      this.loadingData = false;
    });
    
  }

  startCombat() {
    this.inCombat = true;
    this.combatRounds = 0;
    this.combatStartTime = getTimestamp();
    console.log(this.combatStartTime);
  }

  nextTurn() {
    this.combatRounds += 1;
  }

  endCombat() {
    this.inCombat = false;
    let newCombat: CombatData = {
      startTime : this.combatStartTime,
      endTime : getTimestamp(),
      rounds : this.combatRounds
    }
    this.appService.addCombat(newCombat);
  }

  openDieRoll() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;

    const dialogRef = this.rollDialog.open(DiceRollComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
      () => { 
        // add die roll
      }
    );  
  }

  endSession() {
    //let session: SessionData = {
    //  character : this.character,
    //  startTime : this.sessionStartTime,
    //  endTime : getTimestamp(),
    //  combats : this.combats,
    //  rolls : this.rolls
    //}
    this.appService.endActiveSession();
    this.router.navigate(["/"]);
  }

}
