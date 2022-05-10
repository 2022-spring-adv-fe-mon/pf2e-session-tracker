import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { getFormattedDuration, getFormattedDurationOf, SessionData } from '../session-data';

@Component({
  selector: 'app-session-history',
  templateUrl: './session-history.component.html',
  styleUrls: ['./session-history.component.css']
})
export class SessionHistoryComponent implements OnInit {

  loadingData = true;

  profile: string = "";
  sessions: SessionData[] = [];
  listNumber: number = 5;

  constructor(private appService: AppService) { }

  ngOnInit(): void {
    this.appService.whenLoaded(() => {
      this.profile = this.appService.getSelectedProfile();
      this.sessions = this.appService.getSessions(this.profile);
      this.loadingData = false;
    });
  }

  sessionDate(session: SessionData): string {
    let date = new Date(session.endTime);
    let dateString = date.toDateString();
    return dateString;
  }

  sessionLength(session: SessionData): string {
    return getFormattedDurationOf(session);
  }

  showMoreHistory(): void {
    this.listNumber += 5;
  }
}
