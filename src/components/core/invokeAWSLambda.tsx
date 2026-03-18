// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { LambdaClient, InvokeCommand, type InvokeCommandOutput } from '@aws-sdk/client-lambda';

interface IAWSLambdaProps {
  accessKey: string;
  secretAccessKey: string;
  arn: string;
  payload: Record<string, unknown>;
}

const invokeAWSLambda = async (props: IAWSLambdaProps) => {
  const FETCH_TIMEOUT = 100000;

  const client = new LambdaClient({
    region: 'us-east-2',
    credentials: {
      accessKeyId: props.accessKey,
      secretAccessKey: props.secretAccessKey,
    },
  });

  const command = new InvokeCommand({
    FunctionName: props.arn,
    Payload: new TextEncoder().encode(JSON.stringify(props.payload)),
  });

  return new Promise<InvokeCommandOutput | 'DELAY'>((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve('DELAY');
    }, FETCH_TIMEOUT);

    client
      .send(command)
      .then((data) => {
        clearTimeout(timeout);
        resolve(data);
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
  });
};

export default invokeAWSLambda;
