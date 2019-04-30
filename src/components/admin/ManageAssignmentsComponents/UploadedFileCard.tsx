/* UploadedFileCard.jsx */
import * as React from 'react';
import { Button, Card, CardTitle, FontIcon, Media } from 'react-md';

import ReactMarkdown from 'react-markdown';

interface IProps {
  file: any;
  onRemoveClick: any;
  // locale: string;
}

interface IState {
  image: boolean;
  language?: string;
  aspectRatio: any;
}

class UploadedFileCard extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    image: false,
    language: undefined,
    aspectRatio: undefined,
  };

  public componentWillMount() {
    this.determineFileType();
    // this.formatter = Intl.DateTimeFormat(this.props.locale);
  }

  public componentWillReceiveProps(nextProps: IProps) {
    // if (this.props.locale !== nextProps.locale) {
    //   this.formatter = Intl.DateTimeFormat(nextProps.locale);
    // }

    if (this.props.file !== nextProps.file) {
      this.determineFileType(nextProps);
    }
  }

  public gcd = (a: any, b: any): any => {
    if (b === 0) {
      return a;
    }

    return this.gcd(b, a % b);
  };

  public findClosestAspectRatio = (e: any) => {
    const { naturalHeight: h, naturalWidth: w } = e.target;
    const denominator = this.gcd(w, h);
    const x = w / denominator;
    const y = h / denominator;

    if (x < y) {
      this.setState({ aspectRatio: '1-1' });
    }
  };

  public determineFileType = (props = this.props) => {
    const { type, name } = props.file;
    let image = false;
    let language = null;
    if (type.match(/image/)) {
      image = true;
    } else if (name.match(/\.jsx$/)) {
      language = 'jsx';
    } else if (name.match(/\.ts$/)) {
      language = 'typescript';
    } else if (type.match(/text|application\/json/) || !type) {
      language = type.replace(/text\/(x-)?/, '') || 'markdown';
    }

    this.setState({ image, language });
  };

  public removeCard = () => {
    this.props.onRemoveClick(this.props.file);
  };

  public render() {
    const { language, aspectRatio } = this.state;
    const { name, size, lastModified, data, type } = this.props.file;

    const split = name.split('.');
    const extension = split.length === 1 ? 'txt' : split[split.length - 1];

    let content;
    // if (image) {
    //   content = <img src={data} alt={name} onLoad={this.findClosestAspectRatio} />;
    // } else
    if (language !== null) {
      content = <ReactMarkdown source={`\`\`\`${language}\n${data}\n\`\`\``} />;
    } else if (['png', 'jpg', 'jpeg', 'svg', 'pdf'].includes(extension)) {
      content = (
        <div>
          <FontIcon className="file-inputs__upload-card__dummy-file" forceSize={48} forceFontSize>
            not_interested
          </FontIcon>
          File Type Not Supported
        </div>
      );
    } else if (typeof data === 'string') {
      content = <embed src={data} />;
    } else {
      content = (
        <FontIcon className="file-inputs__upload-card__dummy-file" forceSize={48} forceFontSize>
          file_download
        </FontIcon>
      );
    }

    if (language === null) {
      content = <Media aspectRatio={aspectRatio}>{content}</Media>;
    }

    return (
      <Card className={'file-inputs__upload-card'}>
        <Button icon onClick={this.removeCard} className="file-inputs__upload-card__remove">
          close
        </Button>
        {content}
        <CardTitle
          title={`${name} ${type ? `(${type})` : ''}`}
          subtitle={`Last Modified: ${lastModified}. Size: (${size} b)`}
        />
      </Card>
    );
  }
}

export default UploadedFileCard;
