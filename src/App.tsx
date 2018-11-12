import * as React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import LoginForm from './components/LoginForm';
import TopBar from './components/TopBar'

import Grader from './Grader';
import Home from './Home';
import { GRADER, HOME, STUDENT } from './routes';
import Student from './Student';
import './styles/App.scss';
import { IUser } from './types/common'


interface IStudentState {
  displayed_form: string,
  error: string,
  logged_in: boolean,
  user: IUser
}

class App extends React.Component<{}, IStudentState> {
  public state: Readonly<IStudentState> = {
    displayed_form: 'login',
    error: '',
    logged_in: false,
    user: {email: '', id: 0},
  }

  public constructor(props : any) {
    super(props);
    this.state = {
      displayed_form: '',
      error: '',
      logged_in: localStorage.getItem('token') ? true : false,
      user: {email: '', id: 0},
    };
  }

  public componentDidMount() {
    if (this.state.logged_in) {
      fetch('http://localhost:8000/core/current_user/', {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      })
        .then(res => {
          // Mainly to handle token timeout
          if (res.ok) {
            return res.json();
          }
          else {
            return Promise.reject();
          }
        })
        .then(json => {
          this.setState({ user: json });
        })
        .catch(error => {

          this.handleLogout();
          this.setState({logged_in: false});
        });
    }
  }

  public handleLogout = () => {
    localStorage.removeItem('token');
    this.setState({ logged_in: false, user: {email: '', id: 0} });
  };

  public displayForm = (form: string) => {
    this.setState({
      displayed_form: form
    });
  };

  public handleLogin = (e: any, data: any) => {
    e.preventDefault();
    fetch('http://localhost:8000/token-auth/', {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
    })
      .then(res => res.json())
      .then(json => {
        localStorage.setItem('token', json.token);
        this.setState({
          displayed_form: '',
          logged_in: true,
          user: json.user
        })
      })
      .catch(error => {
        this.handleLogout();
        this.setState({error: 'invalid'});
      });
  };

  public toggleLogin = (e: any) => {
    switch (this.state.displayed_form) {
      case 'login':
        this.setState({displayed_form: '', error: ''});
        break;
      default:
        this.setState({displayed_form: 'login'});
    }
  }

  public toggleSignup = (e: any) => {
    switch (this.state.displayed_form) {
      case 'signup':
        this.setState({displayed_form: '', error: ''});
        break;
      default:
        this.setState({displayed_form: 'signup'});
    }
  }

  public render() {
    let form;
    switch (this.state.displayed_form) {
      case 'login':
        form = <LoginForm handleLogin={this.handleLogin} />;
        break;
      default:
        form = null;
    }

    let error;
    switch (this.state.error) {
      case 'invalid':
        error = 'Invalid username and password'
        break;
      default:
        error = null
    }

    if (this.state.logged_in) {
      // @ts-ignore
      return (
       <div>
       <TopBar email={this.state.user.email} handleLogout={this.handleLogout} />
          <div>
              <div className="AppHome">
                <BrowserRouter>
                  <Switch>
                    <Route exact={true} path={STUDENT} component={Student} />
                    <Route exact={true} path={GRADER} component={Grader} />
                    <Route exact={true} path={HOME} component={Home} />
                  </Switch>
                </BrowserRouter>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="App">
          <button onClick={this.toggleLogin}>Login</button>
          <br />
          {form}
          <p>{error}</p>
        </div>
      );
    }
  }
}

export default App;
