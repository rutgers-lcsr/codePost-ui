import * as React from 'react';

interface IProps {
  placeholder: string;
  inactive?: boolean;
  inactiveMessage?: string;
  onChange: any;
  onCancel: any;
}

interface IState {
  value: string;
}

class SearchBar extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    value: '',
  };

  public onCancel = (event: any) => {
    this.setState({ value: '' });
    this.props.onCancel();
  };

  public onChange = (event: any) => {
    const value = event.target.value;
    this.setState({ value });
    this.props.onChange(value);
  };

  public render() {
    const { inactive, inactiveMessage, placeholder } = this.props;
    const { value } = this.state;
    if (inactive) {
      const message = inactiveMessage ? inactiveMessage : 'Loading...';
      return <div className="input-search-bar">{message}</div>;
    }
    {
      /* removed from <input>             ref="input"*/
    }
    return (
      <input
        className="input-search-bar"
        type="text"
        maxLength={100}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        value={value}
        placeholder={placeholder}
        onChange={this.onChange}
      />
    );
  }
}

export default SearchBar;
