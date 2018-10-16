import * as React from 'react';
import './App.css';

import logo from './logo.svg';


interface IStudentState {
  users: string[];
}

class Student extends React.Component<{}, IStudentState> {

  public readonly state = {
    users: []
  }

  public componentWillMount() {
    this.loadUsers();
  }

  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          This is the student page.
          <br/>
            Users:
          <br/>
            {this.state.users.join(',')}
        </p>
      </div>
    );
  }


  private loadUsers() {
    $.ajax({
      cache: true,
      dataType: 'json',
      error: (xhr : any, status : any, err : any) => {
        console.error(xhr, status, err.toString());
      },
      success: (data : any) => {
        const email = 'email';
        this.setState({ users: data.map((val : any) => (val[email])) });
      },
      url: '/api/users/'
    });
  };
}

export default Student;