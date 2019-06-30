/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Comment, Divider, Icon, Tooltip, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import PreAuthLayout from './PreAuthLayout';

import { IQuoteType, quotes } from './quotes';

/**********************************************************************************************************************/

interface IProps {
  isLoggedIn: boolean;
}

interface IState {
  likes: number;
  dislikes: number;
  action: any;
  intercomOpen: boolean;
  quote: IQuoteType;
}

class NoMatch extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      likes: 0,
      dislikes: 0,
      action: null,
      intercomOpen: false,
      quote: quotes[Math.floor(Math.random() * quotes.length)],
    };
  }

  public like = () => {
    this.setState({
      likes: 1,
      dislikes: 0,
      action: 'liked',
    });
  };

  public dislike = () => {
    this.setState({
      likes: 0,
      dislikes: 1,
      action: 'disliked',
    });
  };

  public openIntercom = () => {
    if (this.state.intercomOpen) {
      (window as any).Intercom('hide');
    } else {
      (window as any).Intercom('show');
    }
    this.setState({ intercomOpen: !this.state.intercomOpen });
  };

  public render() {
    const { likes, dislikes, action } = this.state;

    const actions = [
      <span key="like">
        <Tooltip title="Like">
          <Icon type="like" theme={action === 'liked' ? 'filled' : 'outlined'} onClick={this.like} />
        </Tooltip>
        <span style={{ paddingLeft: 8, cursor: 'auto' }}>{likes}</span>
      </span>,
      <span key="dislike">
        <Tooltip title="Dislike">
          <Icon type="dislike" theme={action === 'disliked' ? 'filled' : 'outlined'} onClick={this.dislike} />
        </Tooltip>
        <span style={{ paddingLeft: 8, cursor: 'auto' }}>{dislikes}</span>
      </span>,
    ];

    return (
      <PreAuthLayout isLoggedIn={this.props.isLoggedIn}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
          <Typography.Title level={3}>Whoops! This page doesn't exist!</Typography.Title>
          <Typography.Title level={4}>
            You can <Link to="/">return to our homepage</Link>, or <a onClick={this.openIntercom}>let us know</a> if you
            can't find what you're looking for...
          </Typography.Title>
          <div>...or meditate on the quote below.</div>
          <br />
          <div style={{ width: 600, textAlign: 'left', margin: '0 auto' }}>
            <Divider />
            <Comment
              actions={actions}
              author={<a href={this.state.quote.website}>{this.state.quote.author}</a>}
              datetime={<span>{this.state.quote.source}</span>}
              content={<p>{this.state.quote.quote}</p>}
            />
          </div>
        </div>
      </PreAuthLayout>
    );
  }
}

export default NoMatch;
