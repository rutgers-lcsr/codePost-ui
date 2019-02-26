import * as React from 'react';
import { Button } from 'react-md';

interface IProps {
  title: string;
  list: string[];
  closeCard: (e: any) => void;
}

class CardList extends React.Component<IProps, {}> {
  public render() {
    return (
      <div className="card-wrapper">
        <div className="card">
          <Button className="card__cancel" icon={true} flat={true} onClick={this.props.closeCard}>
            clear
          </Button>
          <div className="card__title">{this.props.title}</div>
          {this.props.list.map((item: string, i: number) => {
            return (
              <div key={i} className="card__item">
                {item}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default CardList;
