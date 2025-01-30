// Angular Core and Material Components
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {MatTableDataSource} from "@angular/material/table";

// FontAwesome Icons
import {
  faPlus,
  faTabletAlt,
  faCircle,
  faUserMinus,
  faUserEdit,
  faCheck,
  faExclamation
} from '@fortawesome/free-solid-svg-icons';

// Custom Components, Services and Types
import {MyErrorStateMatcher, WebDataService,} from "../../services/web-data.service";
import {FormControl, Validators} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {
  MusicalWorkCreateConfirmationComponent
} from "../../dialogs/musical-work-create-confirmation/musical-work-create-confirmation.component";
import {
  Alt_Titles,
  DisplayedOP_Publisher, MusicalWorkElement, Preforming_Artist, RegistrationAck,
  SoundRecordingChange, User, Writer,
  Writers_in_work,
  Writers_splits
} from "../../services/mw-interfaces.service";
import {EndpointsService} from "../../services/endpoints.service";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {PopupMessage, PopupMessageService} from "../../services/popup-messages.service";
import {DeleteConfimationComponent} from "../../dialogs/delete-confimation/delete-confimation.component";


@Component({
  selector: 'app-musical-works-change',
  templateUrl: './musical-works-change-and-add.component.html',
  styleUrls: ['./musical-works-change-and-add.component.css'],
  animations: [
    trigger('fadeOut', [
      state('void', style({opacity: 1})),
      transition(':leave', [
        animate('5s', style({opacity: 0}))  // Adjusted the duration here to 5 seconds
      ])
    ])
  ]
})


export class MusicalWorksChangeAndAddComponent implements OnInit {

  // Public properties used in component
  public id: number = 0;
  private user?: User;
  public title?: string;
  public writersInWorks: Writers_in_work[] = [];
  public recordings: SoundRecordingChange[] = [];
  public performers: Preforming_Artist[] = [];
  public altTitles: Alt_Titles[] = [];
  public registrationAck: RegistrationAck[] = [];
  public hasWriterInWork: boolean = false;
  public hasRecordings: boolean = false;
  public hasPerformers: boolean = false;
  public hasAltTitles: boolean = false;
  public hasRegistrationAck: boolean = false;
  public musical_works?: MusicalWorkElement;
  public writer?: Writer;
  public writers: Writer[] = [];
  public preforming_artist?: Preforming_Artist;
  public isLoading: boolean = false;
  errorMessage: string | null = null;
  public showMessage: boolean = false;
  public WritersInWorkWasClosed: boolean = false;
  public writersTotalShare = 0;

  // MatTable Columns
  public displayedWritersColumns: string[] = ['firstName', 'lastName', 'role', 'writersMechanicalSplit', 'writersSyncSplit', 'writersPerformanceSplit', 'edit', 'delete'];
  public writersDataSource = new MatTableDataSource(this.writersInWorks);
  public displayedRecordingsColumns: string[] = ['recording_Id', 'recording_Title', 'release_Date', 'edit', 'delete'];
  public recordingsDataSource = new MatTableDataSource(this.recordings);
  public displayedPerformersColumns: string[] = ['last_Name', 'first_Name', 'isni', 'edit', 'delete'];
  public performersDataSource = new MatTableDataSource(this.performers);
  public displayedAltTitleColumns: string[] = ['title', 'locale', 'type', 'edit', 'delete'];
  public altTitleDataSource = new MatTableDataSource(this.altTitles);
  public displayedRegistrationAckColumns: string[] = ['work_id', 'status', 'ack_date', 'society', 'edit', 'delete'];
  public registrationAckDataSource = new MatTableDataSource(this.registrationAck);

  // FontAwesome Icons
  public faplus = faPlus;
  public fa_edit = faUserEdit;
  public fa_circle = faCircle;
  public fa_Delete = faUserMinus;
  public fa_check = faCheck;
  public fa_exclamation = faExclamation;

  public mw_status_icon = this.fa_circle;
  public wiw_status_icon = this.fa_circle;
  public at_status_icon = this.fa_circle;
  public rec_status_icon = this.fa_circle;
  public pa_status_icon = this.fa_circle;
  public ra_status_icon = this.fa_circle;
  public mw_iconColor: string = "White";
  public wiw_iconColor: string = "White";
  public rec_iconColor: string = "White";
  public at_iconColor: string = "White";
  public pa_iconColor: string = "white";
  public ra_iconColor: string = "white";

  // Form Control
  // ok
  public musicalWorkTitle = new FormControl('', [Validators.required, Validators.maxLength(50)]);
  public iswc = new FormControl('', [Validators.required, Validators.maxLength(50)]);
  public isLibrary = new FormControl('', [Validators.required]);
  public matcher = new MyErrorStateMatcher();

  // Inject services in the constructor
  constructor(private route: ActivatedRoute, private Web_Data: WebDataService, private router: Router, private dialog: MatDialog, private request_endpoint: EndpointsService) {
  }

  ngOnInit(): void {

    this.request_endpoint.getCurrentUser().subscribe({
      next: responds => {
        if (responds.success) {
          console.log(responds.message);

          this.user = responds.user;

          this.musicalWorkTitle.valueChanges.subscribe(value => {
            console.log('Musical Work Title Changed:', value);
            this.updateIconAndColor();
          });

          this.iswc.valueChanges.subscribe(value => {
            console.log('ISWC Changed:', value);
            this.updateIconAndColor();
          });

          // Subscribe to the route parameters
          this.route.paramMap.subscribe(params => {
            let idParam = params.get("id");

            // If there's an 'id' parameter, parse it and set the component's 'id' property
            if (idParam != null) {
              this.id = parseInt(idParam);
            }

            // If the id is '0', the user is adding a new musical work
            if (this.id === 0) {
              this.title = "ADD MUSICAL WORK";
              this.hasWriterInWork = false;
              this.hasRecordings = false;
              this.hasPerformers = false;
              this.hasAltTitles = false;
              this.hasRegistrationAck = false;

              const dialogRef = this.dialog.open(MusicalWorkCreateConfirmationComponent);

              dialogRef.afterClosed().subscribe(result => {
                if (result) { // If result is true, user clicked "Yes"
                  // Call the WebDataService to create a new musical work
                  this.isLoading = true;
                  this.request_endpoint.createMusicalWork({
                    iswc: "NA",
                    is_library: false,
                    title: "Musical Work(No Name Associated)",
                    work_type: 1,
                    id: 0,
                    user_id: this.user?.id
                  })
                    .subscribe({
                      next: value => {
                        // If successful, set the 'id' property to the id of the newly created musical work
                        this.isLoading = false;
                        this.id = value.musical_work.id;
                        console.log(value);
                      },
                      error: err => {
                        // If there's an error, log it
                        console.log("Server rejected the request.");
                      }
                    });
                } else {
                  this.Web_Data.CloseWindow('Canceled')
                }
              });

            }
            // If the id is not '0', the user is editing an existing musical work
            else {
              this.title = "CHANGE MUSICAL WORK";
              let totalShare = 0;

              // Get the musical work
              this.isLoading = true;
              this.request_endpoint.getMusicalWork(this.id).subscribe({
                next: work => {
                  this.musicalWorkTitle.setValue(work.title);
                  this.iswc.setValue(work.iswc);
                  this.isLibrary.setValue(work.is_library);

                  let writerSplit = work.writer_splits;
                  let recordings_In_Musical_Works = work.recordings;
                  let performers = work.performers;
                  let altTitles = work.alt_titles;
                  let registrationsAcks = work.acks;

                  if (writerSplit) {
                    this.hasWriterInWork = true;
                    const newWritersInWorks: Writers_in_work[] = []; // Temporary array to hold updated list

                    writerSplit.forEach((split, index) => {
                      let writerId = split.writer_id;
                      const publishers = split.op_publishers;
                      const displayedOP_Publishers: DisplayedOP_Publisher[] = [];

                      if (publishers) {
                        publishers.forEach((pub, j) => {

                          this.request_endpoint.GetPublisherSplit(pub.op_publisher_splits_id).subscribe({
                            next: publisherSplit => {

                              this.request_endpoint.getPublisher(publisherSplit.publisher_id).subscribe({
                                next: publisher => {

                                  let displayedOpPublisher: DisplayedOP_Publisher = {
                                    publisher_name: publisher.company_name, // Placeholder for publisher name
                                    publisher_mechanical_split: pub.publisher_mechanical_split,
                                    publisher_sync_split: pub.publisher_sync_split,
                                    publisher_proformance_split: pub.publisher_proformance_split
                                  };
                                  displayedOP_Publishers.push(displayedOpPublisher);
                                }, error: err => {
                                  console.log("Cant find Publisher");
                                }
                              })

                            }, error: err => {
                              console.log("Cant find Publisher Split");
                            }
                          })
                        });
                      }

                      if (typeof writerId === 'number') {
                        this.request_endpoint.getWriter(writerId).subscribe({
                          next: writerDetails => {
                            let writerInWork: Writers_in_work = {
                              id: split.id,
                              writer_first_name: writerDetails.first_name,
                              writer_last_name: writerDetails.last_name,
                              role: split.writer_type,
                              controlled: split.controlled,
                              writer_mechanical_split: split.writer_mechanical_split,
                              writer_sync_split: split.writer_sync_split,
                              writer_proformance_split: split.writer_proformance_split,
                              DisplayedOP_Publisher: displayedOP_Publishers,
                              percentage_of_song_owned: split.percentage_of_song_owned
                            };

                            newWritersInWorks.push(writerInWork);

                            // @ts-ignore
                            if (index === writerSplit.length - 1) { // Last iteration
                              this.writersInWorks = newWritersInWorks; // Replace old list with new list
                            }
                          },
                          error: err => {
                            console.error('could not gather data for writer ID:', writerId, err);
                          }
                        });
                      }
                    });

                    //this.popupMessageService.showMessage('Writer in work successfully updated!', 'success');

                    let writers = work.writer_splits;

                    if (writers) {
                      this.updateWritersInWorkStatus(writers);
                    }
                  }

                  if (recordings_In_Musical_Works) {
                    this.hasRecordings = true;
                    for (let i = 0; i < recordings_In_Musical_Works!.length; i++) {
                      this.recordings.push(recordings_In_Musical_Works[i]);
                      this.recordingsDataSource.data = this.recordings;
                    }

                    this.updateRecodingStatus(recordings_In_Musical_Works);
                  }

                  if (performers) {
                    this.hasPerformers = true;
                    for (let i = 0; i < performers!.length; i++) {
                      this.performers.push(performers[i]);
                      this.performersDataSource.data = this.performers;

                      this.updatePerformingArtistStatus(performers);

                    }


                  }

                  if (altTitles) {
                    this.hasAltTitles = true;
                    for (let i = 0; i < altTitles!.length; i++) {
                      this.altTitles.push(altTitles[i]);
                      this.altTitleDataSource.data = this.altTitles;
                    }

                    this.updateAltTitleStatus(altTitles);
                  }

                  if (registrationsAcks) {
                    this.hasRegistrationAck = true;
                    for (let i = 0; i < registrationsAcks!.length; i++) {
                      this.registrationAck.push(registrationsAcks[i]);
                      this.registrationAckDataSource.data = this.registrationAck;
                    }
                  }

                  this.isLoading = false;

                }, error: err => {

                  console.log('could not gather data')

                }
              })
            }
          });

        } else {
          console.log(responds.message);
        }
      }, error: err => {
        this.router.navigate(['/login_page']).then(r => {
        });
      }
    })

  }

  private updateIconAndColor() {
    if (this.musicalWorkTitle.value === "Musical Work(No Name Associated)" || this.iswc.value === "NA") {
      this.mw_status_icon = this.fa_exclamation;
      this.mw_iconColor = 'yellow';  // Red color for warning
    } else {
      this.mw_status_icon = this.fa_check;
      this.mw_iconColor = 'green';  // Green color for OK
    }
  }

  private updateWritersInWorkStatus(writers: Writers_splits[]) {
    let totalShare = 0;

    for (let writer of writers) {
      // @ts-ignore
      totalShare += writer.percentage_of_song_owned;
    }

    if (totalShare === 100) {
      this.wiw_status_icon = this.fa_check;
      this.wiw_iconColor = "green";
    } else if (totalShare === 0) {
      this.wiw_status_icon = this.fa_circle;
      this.wiw_iconColor = "white";
    } else {
      // Show a warning or set appropriate status if the value is anything other than 100 or 0
      this.wiw_status_icon = this.fa_exclamation;
      this.wiw_iconColor = "yellow";
    }

    this.writersTotalShare = totalShare;


  }

  private updateRecodingStatus(recordings: SoundRecordingChange[]){
    if (recordings.length == 0){
      this.rec_status_icon = this.fa_circle;
      this.rec_iconColor = "white";
      return;
    }

    for (let i = 0; i < recordings!.length; i++) {
      if (recordings[i].record_label_id == null){
        this.rec_status_icon = this.fa_exclamation;
        this.rec_iconColor = "yellow";
        return;
      }
    }

    this.rec_status_icon = this.fa_check;
    this.rec_iconColor = "green";

  }

  private updateAltTitleStatus(altTitles: Alt_Titles[]){
    // Check if the array is empty
    if (altTitles.length === 0) {
      this.at_status_icon = this.fa_circle;
      this.at_iconColor = "white";
      return;
    }

    const seenTitles = new Set();
    for (let i = 0; i < altTitles.length; i++) {
      const title = altTitles[i].title; // Assuming `title` is the property you want to check

      // Check if the title has already been seen
      if (seenTitles.has(title)) {
        this.at_status_icon = this.fa_exclamation;
        this.at_iconColor = "yellow";
        return; // Exit the function as soon as a duplicate is found
      }

      // Add the current title to the set of seen titles
      seenTitles.add(title);
    }

    // If no duplicates are found, set the icon to 'check' and color to 'green'
    this.at_status_icon = this.fa_check;
    this.at_iconColor = "green";
  }

  private updatePerformingArtistStatus(artists: Preforming_Artist[]) {
    // Check if the array is empty
    if (artists.length === 0) {
      this.pa_status_icon = this.fa_circle;
      this.pa_iconColor = "white";
      return;
    }

    const seenArtists = new Set();
    for (let i = 0; i < artists.length; i++) {
      const artist = artists[i];
      const artistKey = artist.first_name + artist.last_name + artist.isni; // Create a unique key for each artist

      // Check if the artist has already been seen
      if (seenArtists.has(artistKey)) {
        this.pa_status_icon = this.fa_exclamation;
        this.pa_iconColor = "yellow";
        return; // Exit the function as soon as a duplicate is found
      }

      // Add the current artistKey to the set of seen artists
      seenArtists.add(artistKey);
    }

    // If no duplicates are found, set the icon to 'check' and color to 'green'
    this.pa_status_icon = this.fa_check;
    this.pa_iconColor = "green";
  }

  // Method to open a pop-up for adding a writer and handle its closure
  public openAddWriterInWorkPopUp() {
    const writers_in_work_window = window.open('/writers_in_work/add?id=' + this.id, '_blank', 'popup');
    let totalShare = 0;
    // Poll the window object every second to see if it's closed
    const checkWindowClosed = setInterval(() => {
      if (writers_in_work_window?.closed) {
        clearInterval(checkWindowClosed);
        this.WritersInWorkWasClosed = true;
        console.log('Window closed');

        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            let writerSplit = value.writer_splits;

            if (writerSplit) {
              this.hasWriterInWork = true;
              const newWritersInWorks: Writers_in_work[] = []; // Temporary array to hold updated list

              writerSplit.forEach((split, index) => {
                let writerId = split.writer_id;
                const publishers = split.op_publishers;
                const displayedOP_Publishers: DisplayedOP_Publisher[] = [];

                if (publishers) {
                  publishers.forEach((pub, j) => {

                    this.request_endpoint.GetPublisherSplit(pub.op_publisher_splits_id).subscribe({
                      next: publisherSplit => {

                        this.request_endpoint.getPublisher(publisherSplit.publisher_id).subscribe({
                          next: publisher => {

                            let displayedOpPublisher: DisplayedOP_Publisher = {
                              publisher_name: publisher.company_name, // Placeholder for publisher name
                              publisher_mechanical_split: pub.publisher_mechanical_split,
                              publisher_sync_split: pub.publisher_sync_split,
                              publisher_proformance_split: pub.publisher_proformance_split
                            };
                            displayedOP_Publishers.push(displayedOpPublisher);
                          }, error: err => {
                            console.log("Cant find Publisher");
                          }
                        })

                      }, error: err => {
                        console.log("Cant find Publisher Split");
                      }
                    })
                  });
                }

                if (typeof writerId === 'number') {
                  this.request_endpoint.getWriter(writerId).subscribe({
                    next: writerDetails => {
                      let writerInWork: Writers_in_work = {
                        id: split.id,
                        writer_first_name: writerDetails.first_name,
                        writer_last_name: writerDetails.last_name,
                        role: split.writer_type,
                        controlled: split.controlled,
                        writer_mechanical_split: split.writer_mechanical_split,
                        writer_sync_split: split.writer_sync_split,
                        writer_proformance_split: split.writer_proformance_split,
                        DisplayedOP_Publisher: displayedOP_Publishers,
                        percentage_of_song_owned: split.percentage_of_song_owned
                      };

                      newWritersInWorks.push(writerInWork);

                      // @ts-ignore
                      if (index === writerSplit.length - 1) { // Last iteration
                        this.writersInWorks = newWritersInWorks; // Replace old list with new list
                      }

                    },
                    error: err => {
                      console.error('could not gather data for writer ID:', writerId, err);
                    }
                  });
                }
              });
              //this.popupMessageService.showMessage('Writer in work successfully created!', 'success');

              let writers = value.writer_splits;

              if (writers) {
                this.updateWritersInWorkStatus(writers);
              }
            }
          },
          error: err => {
            console.error('Failed to refresh musical work data:', err);
          }
        });
      }
    }, 1000); // Check every 1 second 1000); // Check every 1 second
  }

  // This is a method to open up a pop-up for adding recordings
  public openAddRecordingsPopUp() {
    const recordings_window = window.open('/recordings/add?id=' + this.id, '_blank', 'popup');

    const checkWindowClosed = setInterval(() => {
      if (recordings_window?.closed) {
        clearInterval(checkWindowClosed);
        console.log('Window closed');

        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            let recordings_In_Musical_Works = value.recordings;
            let newRecordings = [];

            if (recordings_In_Musical_Works) {
              this.hasRecordings = true;
              for (let recording of recordings_In_Musical_Works) {
                // Check if the recording is not already present in the recordings list
                if (!this.recordings.find(r => r.id === recording.id)) {
                  newRecordings.push(recording);
                }
              }

              if (newRecordings.length > 0) {
                this.recordings.push(...newRecordings);
                this.recordingsDataSource.data = this.recordings;
              }

              this.updateRecodingStatus(recordings_In_Musical_Works);
            }
          }
        });
      }
    }, 1000);
  }

  public openAddPerformersPopUp() {
    const performers_window = window.open('/performing_artist/add?id=' + this.id, '_blank', 'popup');

    const checkWindowClosed = setInterval(() => {
      if (performers_window?.closed) {
        clearInterval(checkWindowClosed);
        console.log('Window closed');

        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            let performersFromServer = value.performers;

            if (performersFromServer && performersFromServer.length > this.performers.length) {
              this.hasPerformers = true;

              // Only add the new performers to the list
              let newPerformers = performersFromServer.slice(this.performers.length);
              this.performers.push(...newPerformers);

              this.performersDataSource.data = this.performers;
            }

            if (performersFromServer){
              this.updatePerformingArtistStatus(performersFromServer);
            }


          }
        });
      }
    }, 1000);
  }

  public openAddAltTitlePopUp() {
    const altTile_window = window.open('/alt_titles/add?id=' + this.id, '_blank', 'popup');

    const checkWindowClosed = setInterval(() => {
      if (altTile_window?.closed) {
        clearInterval(checkWindowClosed);
        console.log('Window closed');

        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            let altTitlesFromServer = value.alt_titles;

            if (altTitlesFromServer && altTitlesFromServer.length > this.altTitles.length) {
              this.hasAltTitles = true;

              // Only add the new altTitles to the list
              let newAltTitles = altTitlesFromServer.slice(this.altTitles.length);
              this.altTitles.push(...newAltTitles);

              this.altTitleDataSource.data = this.altTitles;
            }

            if (altTitlesFromServer){
              this.updateAltTitleStatus(altTitlesFromServer);
            }
          }
        });
      }
    }, 1000);
  }

  public OpenEditAltTilePopUp(id: number) {
    const AltTitle_change_window = window.open('/alt_titles/change/' + id, '_blank', 'popup');

    // Store the current recordings
    const initialAlts = [...this.altTitles];

    // Poll the window object every second to see if it's closed
    const checkWindowClosed = setInterval(() => {
      if (AltTitle_change_window?.closed) {
        clearInterval(checkWindowClosed);
        console.log('Window closed');

        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            this.altTitles = value.alt_titles || [];
            console.log(this.altTitles);

            // Check for deep equality
            if (!this.deepEqual(initialAlts, this.altTitles)) {
              this.altTitleDataSource.data = this.altTitles;
            }

            if (value.alt_titles){
              this.updateAltTitleStatus(value.alt_titles);
            }

          }
        });
      }
    }, 1000); // Check every 1 second
  }

  public openAddRegistrationAckPopUp() {
    const registrationAck_window = window.open('/registration_ack/add?id=' + this.id, '_blank', 'popup');

    const checkWindowClosed = setInterval(() => {
      if (registrationAck_window?.closed) {
        clearInterval(checkWindowClosed);
        console.log('Window closed');

        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            let registrationAcksFromServer = value.acks;

            if (registrationAcksFromServer && registrationAcksFromServer.length > this.registrationAck.length) {
              this.hasRegistrationAck = true;

              // Only add the new registrationAcks to the list
              let newRegistrationAcks = registrationAcksFromServer.slice(this.registrationAck.length);
              this.registrationAck.push(...newRegistrationAcks);

              this.registrationAckDataSource.data = this.registrationAck;
            }
          }
        });
      }
    }, 1000);
  }

  public OpenEditRegistrationAckPopUp(id: number) {
    const RegistrationAck_change_window = window.open('/registration_ack/change/' + id, '_blank', 'popup');

    // Store the current recordings
    const initialAcks = [...this.registrationAck];

    // Poll the window object every second to see if it's closed
    const checkWindowClosed = setInterval(() => {
      if (RegistrationAck_change_window?.closed) {
        clearInterval(checkWindowClosed);
        console.log('Window closed');

        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            this.registrationAck = value.acks || [];
            console.log(this.registrationAck);

            // Check for deep equality
            if (!this.deepEqual(initialAcks, this.registrationAck)) {
              this.registrationAckDataSource.data = this.registrationAck;
            }
          }
        });
      }
    }, 1000); // Check every 1 second
  }

// Method to open a pop-up for editing a writer and handle its closure
  public OpenEditWriterPopUp(id: number) {
    const writers_in_work_change_window = window.open('/writers_in_work/change/' + id, '_blank', 'popup');
    let totalShare = 0;
    // Poll the window object every second to see if it's closed
    const checkWindowClosed = setInterval(() => {
      if (writers_in_work_change_window?.closed) {
        clearInterval(checkWindowClosed);
        this.WritersInWorkWasClosed = true;
        console.log('Window closed');

        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            let writerSplit = value.writer_splits;

            if (writerSplit) {
              this.hasWriterInWork = true;
              const newWritersInWorks: Writers_in_work[] = []; // Temporary array to hold updated list

              writerSplit.forEach((split, index) => {
                let writerId = split.writer_id;
                const publishers = split.op_publishers;
                const displayedOP_Publishers: DisplayedOP_Publisher[] = [];

                if (publishers) {
                  publishers.forEach((pub, j) => {

                    this.request_endpoint.GetPublisherSplit(pub.op_publisher_splits_id).subscribe({
                      next: publisherSplit => {

                        this.request_endpoint.getPublisher(publisherSplit.publisher_id).subscribe({
                          next: publisher => {

                            let displayedOpPublisher: DisplayedOP_Publisher = {
                              publisher_name: publisher.company_name, // Placeholder for publisher name
                              publisher_mechanical_split: pub.publisher_mechanical_split,
                              publisher_sync_split: pub.publisher_sync_split,
                              publisher_proformance_split: pub.publisher_proformance_split
                            };
                            displayedOP_Publishers.push(displayedOpPublisher);
                          }, error: err => {
                            console.log("Cant find Publisher");
                          }
                        })

                      }, error: err => {
                        console.log("Cant find Publisher Split");
                      }
                    })
                  });
                }

                if (typeof writerId === 'number') {
                  this.request_endpoint.getWriter(writerId).subscribe({
                    next: writerDetails => {
                      let writerInWork: Writers_in_work = {
                        id: split.id,
                        writer_first_name: writerDetails.first_name,
                        writer_last_name: writerDetails.last_name,
                        role: split.writer_type,
                        controlled: split.controlled,
                        writer_mechanical_split: split.writer_mechanical_split,
                        writer_sync_split: split.writer_sync_split,
                        writer_proformance_split: split.writer_proformance_split,
                        DisplayedOP_Publisher: displayedOP_Publishers,
                        percentage_of_song_owned: split.percentage_of_song_owned
                      };

                      newWritersInWorks.push(writerInWork);

                      // @ts-ignore
                      if (index === writerSplit.length - 1) { // Last iteration
                        this.writersInWorks = newWritersInWorks; // Replace old list with new list
                      }
                    },
                    error: err => {
                      console.error('could not gather data for writer ID:', writerId, err);
                    }
                  });
                }
              });

              //this.popupMessageService.showMessage('Writer in work successfully updated!', 'success');

              let writers = value.writer_splits;

              if (writers) {
                this.updateWritersInWorkStatus(writers);
              }
            }
          },
          error: err => {
            console.error('Failed to refresh musical work data:', err);
          }
        });
      }
    }, 1000); // Check every 1 second
  }

  private deepEqual(obj1: any, obj2: any) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  public OpenEditRecordingsPopUp(id: number) {
    const Recordings_change_window = window.open('/recordings/change/' + id, '_blank', 'popup');

    // Store the current recordings
    const initialRecordings = [...this.recordings];

    // Poll the window object every second to see if it's closed
    const checkWindowClosed = setInterval(() => {
      if (Recordings_change_window?.closed) {
        clearInterval(checkWindowClosed);
        console.log('Window closed');

        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            this.recordings = value.recordings || [];
            console.log(this.recordings);

            // Check for deep equality
            if (!this.deepEqual(initialRecordings, this.recordings)) {
              this.recordingsDataSource.data = this.recordings;
            }

            let recordings_In_Musical_Works = value.recordings;

            if (recordings_In_Musical_Works) {
              this.updateRecodingStatus(recordings_In_Musical_Works);
            }
          }
        });
      }
    }, 1000); // Check every 1 second
  }

  public OpenEditPerformerPopUp(id: number) {
    const Performer_change_window = window.open('/performing_artist/change/' + id, '_blank', 'popup');

    // Store the current recordings
    const initialPerformers = [...this.performers];

    // Poll the window object every second to see if it's closed
    const checkWindowClosed = setInterval(() => {
      if (Performer_change_window?.closed) {
        clearInterval(checkWindowClosed);
        console.log('Window closed');

        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            this.performers = value.performers || [];
            console.log(this.performers);

            // Check for deep equality
            if (!this.deepEqual(initialPerformers, this.performers)) {
              this.performersDataSource.data = this.performers;
            }

            if (value.performers){
              this.updatePerformingArtistStatus(value.performers);
            }

          }
        });
      }
    }, 1000); // Check every 1 second
  }

  AddWriter() {
    this.openAddWriterInWorkPopUp();
  }

  EditWriter(id: number) {
    this.OpenEditWriterPopUp(id);
  }

  public DeleteWriter(id: number) {

    const dialogRef = this.dialog.open(DeleteConfimationComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) { // If result is true, user clicked "Yes"
        console.log('Deleting writers in work...')
        this.isLoading = true;
        this.request_endpoint.deleteWritersSplits(id).subscribe({
          next: value => {
            // Filter out the deleted writer from the writers array
            this.writersInWorks = this.writersInWorks.filter(writer => writer.id !== id);

            // Update the dataSource to refresh the table
            this.writersDataSource.data = this.writersInWorks;

            if (this.writersInWorks.length == 0) {
              this.hasWriterInWork = false;
            }

            console.log('Deleting Completed')

            this.request_endpoint.getMusicalWork(this.id).subscribe({
              next: value1 => {
                let writers = value1.writer_splits;

                if (writers) {
                  this.updateWritersInWorkStatus(writers);
                }

                this.isLoading = false;
              }, error: err => {
                console.log("Cant Find Musical Work");
                this.isLoading = false;
              }
            })

          }
        })
      } else {

      }
    });
  }

  add_Recordings() {
    this.openAddRecordingsPopUp();
  }

  deleteRecording(id: number) {
    this.isLoading = true;
    this.request_endpoint.deleteRecording(id).subscribe({
      next: value => {
        this.isLoading = false;
        console.log("File Deleted");

        // Filter out the deleted writer from the writers array
        this.recordings = this.recordings.filter(recording => recording.id !== id);

        // Update the dataSource to refresh the table
        this.recordingsDataSource.data = this.recordings;

        if (this.recordings.length == 0) {
          this.hasRecordings = false;
        }

        console.log('Deleting Completed')


        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            let recordings_In_Musical_Works = value.recordings;
            let newRecordings = [];

            if (recordings_In_Musical_Works) {
              this.updateRecodingStatus(recordings_In_Musical_Works);
            }
          }
        });

      }, error: err => {
        console.log("Attempt failed")
      }
    })
  }

  add_artist_works() {
    this.openAddPerformersPopUp();
  }

  public deleteArtistPerforming(id: number) {
    this.isLoading = true;
    this.request_endpoint.deletePreformingArtist(id).subscribe({
      next: value => {
        this.isLoading = false;
        console.log("File Deleted");

        this.performers = this.performers.filter(performer => performer.id !== id);

        // Update the dataSource to refresh the table
        this.performersDataSource.data = this.performers;

        if (this.performers.length == 0) {
          this.hasPerformers = false;
        }

        console.log('Deleting Completed')
        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {

            if (value.performers){
              this.updatePerformingArtistStatus(value.performers);
            }

            this.isLoading = false;

          }
        });
      }, error: err => {
        console.log("Failed to delete performing artist")
      }
    })
  }

  add_alt_title() {
    this.openAddAltTitlePopUp();
  }

  public deleteAltTitle(id: number) {
    this.isLoading = true
    this.request_endpoint.deleteAltTitle(id).subscribe({
      next: value => {
        this.isLoading = false;
        console.log("File Deleted");

        this.altTitles = this.altTitles.filter(altTitle => altTitle.id !== id);

        // Update the dataSource to refresh the table
        this.altTitleDataSource.data = this.altTitles;

        if (this.altTitles.length == 0) {
          this.hasAltTitles = false;
        }

        console.log('Deleting Completed')

        this.request_endpoint.getMusicalWork(this.id).subscribe({
          next: value => {
            let alt_titles = value.alt_titles;

            if (alt_titles) {
              this.updateAltTitleStatus(alt_titles);
            }
          }
        });

      }, error: err => {
        console.log("Failed to delete alt title")
      }
    })
  }

  add_registration_ack() {
    this.openAddRegistrationAckPopUp();
  }

  public deleteRegistrationAck(id: number) {
    this.isLoading = true;
    this.request_endpoint.deleteRegistrationAck(id).subscribe({
      next: value => {
        this.isLoading = false;
        console.log("File Deleted");

        this.registrationAck = this.registrationAck.filter(registration_ack => registration_ack.id !== id);

        // Update the dataSource to refresh the table
        this.registrationAckDataSource.data = this.registrationAck;

        if (this.registrationAck.length == 0) {
          this.hasRegistrationAck = false;
        }

        console.log('Deleting Completed')
        this.isLoading = false;
      }, error: err => {
        console.log("Failed to delete RegistrationAck")
      }
    })
  }

  UpdateMusicalWork() {
    this.request_endpoint.updateMusicalWork({
      iswc: this.iswc.value,
      is_library: false,
      title: this.musicalWorkTitle.value,
      work_type: 1,
      id: this.id,
      user_id: this.user?.id
    }, this.id).subscribe({
      next: value => {
        console.log('Musical work updated')
        console.log(value);
        this.isLoading = false;
        this.Web_Data.CloseWindow('Closing this window');
      }, error: err => {
        console.log('Musical work failed to update')
      }
    })
  }

  public onSubmit() {
    this.isLoading = true;
    let totalShare = 0;

    if (this.musicalWorkTitle.valid && this.iswc.valid) {

      console.log('Updating musical work...');
      this.request_endpoint.getMusicalWork(this.id).subscribe({
        next: value => {
          let writers = value.writer_splits;

          if (writers) {
            for (let writer of writers) {
              totalShare += writer.percentage_of_song_owned;
            }

            if (totalShare === 100) {
              this.UpdateMusicalWork();
            } else {
              this.errorMessage = "Total share is over or under 100";
              console.error(this.errorMessage);
              this.isLoading = false;
            }
          } else {
            this.UpdateMusicalWork();
          }
        },
        error: err => {
          console.error("An unexpected error occurred", err);
          this.errorMessage = "An unexpected error occurred. Please try again later.";
          this.isLoading = false;
        }
      });

    } else {
      this.isLoading = false;
    }
  }

  public openUpWritersInWorkWarningDialog(){
    if (this.wiw_iconColor === 'yellow') {
      this.Web_Data.GenerateAndOpenWarningDialogBox("Total Share", "Total Share Among All Writers must be 0 or 100");
    }
  }
  public openUpMusicalWorkWarningDialog(){
    if (this.mw_iconColor == 'yellow') {
      this.Web_Data.GenerateAndOpenWarningDialogBox("Tile and ISWC", "Title and ISWC should be named properly");
    }
  }
  public openUpRecordingWarningDialog(){
    if (this.rec_iconColor == 'yellow'){
      this.Web_Data.GenerateAndOpenWarningDialogBox("Music label is null/Empty", "You might have just deleted a music label there for one of your recordings have a music label that is null");
    }
  }
  public openUpAltTitleWarningDialog(){
    if (this.at_iconColor == 'yellow'){
      this.Web_Data.GenerateAndOpenWarningDialogBox("Duplicate Entry", "You have multiple of the same entry");
    }
  }
  public openUpPerformingArtistWarningDialog(){
    if (this.pa_iconColor == 'yellow'){
      this.Web_Data.GenerateAndOpenWarningDialogBox("Duplicate Entry", "You have multiple of the same entry");
    }
  }

  protected readonly Range = Range;
}








