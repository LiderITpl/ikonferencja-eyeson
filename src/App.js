import React, {Component, Fragment} from 'react';
import {TextField, TextFieldHelperText} from '@rmwc/textfield';
import {IconButton} from '@rmwc/icon-button';
import {ThemeProvider} from '@rmwc/theme';
import {Grid, GridCell} from '@rmwc/grid';
import {LinearProgress} from '@rmwc/linear-progress';
import eyeson, {StreamHelpers} from 'eyeson';
import Toolbar from './Toolbar';
import Video from './Video';
import './App.css';
import axios from 'axios';

const ACCESS_KEY_LENGTH = 24;
const API_URL_BASE = 'https://live.ikonferencja.pl/restapi/api/api.php';

class App extends Component {
  state = {
    local: null, stream: null, connecting: false,
    audio: true, video: true, screen: false, token: '',
    extra: {
      userName: undefined,
      roomName: undefined,
    }
  };

  constructor(props) {
    super(props);
    this.start = this.start.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
    this.toggleAudio = this.toggleAudio.bind(this);
    this.toggleVideo = this.toggleVideo.bind(this);
    this.toggleScreen = this.toggleScreen.bind(this);
    this.onTokenFieldChange = this.onTokenFieldChange.bind(this);
    this.getTokenFromQuery = this.getTokenFromQuery.bind(this);
    this.askServerForExtraData = this.askServerForExtraData.bind(this);

    const token = this.getTokenFromQuery();
    if(typeof(token) === "string") {
      this.state.token = token;
    }
  }

  componentDidMount() {
    eyeson.onEvent(this.handleEvent);
    if(this.state.token.length === ACCESS_KEY_LENGTH) {
      this.start();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(prevState.token !== this.state.token && this.state.token.length === ACCESS_KEY_LENGTH) {
      this.start();
    }
  }

  getTokenFromQuery() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('token');
  }

  handleEvent(event) {
    if (event.type === 'presentation_ended') {
      eyeson.send({ type: 'start_stream', audio: this.state.audio,
                    video: this.state.video });
      this.setState({screen: false});
      return;
    }
    if (event.type !== 'accept') {
      console.debug('[App]', 'Ignore received event:', event.type);
      return;
    }
    this.setState({
      local: event.localStream,
      stream: event.remoteStream,
      connecting: false,
    });
  }

  toggleAudio() {
    const audioEnabled = !this.state.audio;
    if (audioEnabled) {
      StreamHelpers.enableAudio(this.state.local);
    } else {
      StreamHelpers.disableAudio(this.state.local);
    }
    this.setState({audio: audioEnabled});
  }

  toggleVideo() {
    eyeson.send({
      type: 'change_stream',
      stream: this.state.local,
      video: !this.state.video,
      audio: this.state.audio,
    });
    this.setState({video: !this.state.video});
  }

  toggleScreen() {
    if (!this.state.screen) {
      eyeson.send({ type: 'start_screen_capture', audio: this.state.audio,
                    screenStream: null, screen: true });
      this.setState({screen: true});
    } else {
      eyeson.send({ type: 'stop_presenting' });
    }
  }

  onTokenFieldChange(event) {
    const key = event.target.value.trim();
    this.setState({
      token: key,
    });
  }

  async start() {
    const { token } = this.state;
    this.setState({connecting: true});
    await this.askServerForExtraData();
    eyeson.start(token);
  }

  async askServerForExtraData() {
    const { token } = this.state;
    try {
      const response = await axios.get(`${API_URL_BASE}?token=${token}`);
      const data = response.data;
      if(
          typeof(data.status) !== "string"
          || data.status !== "OK"
          || typeof(data.data) !== "object"
          || !Array.isArray(data.data)
          || typeof(data.data[0].userName) !== "string"
          || typeof(data.data[0].roomName) !== "string"
      ) {
        throw new Error("Uszkodzony format danych.");
      }
      this.setState({
        extra: {
          userName: data.data[0].userName,
          roomName: data.data[0].roomName
        }
      });
    } catch(err) {
      console.error('Nie udało się pobrać extra-danych użytkownika.');
      console.error(err.message);
    }
  }

  render() {
    return (
      <ThemeProvider options={{primary: '#9e206c', secondary: '#6d6d6d'}}>
        <Toolbar title="Web GUI React App" />
        <Grid className="App">
          <GridCell span="12">
            {this.state.connecting && <LinearProgress />}
          </GridCell>
          <GridCell span="11">
            {!this.state.stream && (
              <Fragment>
                <TextField
                  label="Meeting Access Key"
                  onChange={this.onTokenFieldChange}
                  value={this.state.token}
                  disabled={this.state.connecting}
                />
                <TextFieldHelperText>
                  Get an user access key from starting a meeting via the API or
                  use one from an active meeting.
                </TextFieldHelperText>
              </Fragment>
            )}
            {this.state.stream && <Video src={this.state.stream} />}
          </GridCell>
          <GridCell span="1" className="App-sidebar">
            {this.state.stream && (
              <Fragment>
                <IconButton
                  checked={this.state.audio}
                  onClick={this.toggleAudio}
                  label="Toggle audio"
                  icon={this.state.audio ? 'mic' : 'mic_off'}
                />
                <IconButton
                  checked={this.state.video}
                  onClick={this.toggleVideo}
                  label="Toggle video"
                  icon={this.state.video ? 'videocam' : 'videocam_off'}
                />
                <IconButton
                  checked={this.state.screen}
                  onClick={this.toggleScreen}
                  label="Share screen"
                  icon={this.state.video ? 'screen_share' : 'stop_screen_share'}
                />
              </Fragment>
            )}
          </GridCell>
        </Grid>
      </ThemeProvider>
    );
  }
}

export default App;
