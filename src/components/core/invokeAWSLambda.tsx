// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import AWS from 'aws-sdk';

interface IAWSLambdaProps {
  accessKey: string;
  secretAccessKey: string;
  arn: string;
  payload: any;
}

const invokeAWSLambda = async (props: IAWSLambdaProps) => {
  const FETCH_TIMEOUT = 100000;

  // This function creates a service object to execute AWS actions
  const createService = () => {
    if (AWS.config && AWS.config.update) {
      AWS.config.update({
        credentials: new AWS.Credentials(props.accessKey, props.secretAccessKey),
        region: 'us-east-2',
      });
    }

    return new AWS.Lambda();
  };

  // This function invokes a lambda function based on a service lambda, arn, and payload
  const invokeLambda = (lambda: any, arn: string, payload: any) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(function () {
        resolve('DELAY');
      }, FETCH_TIMEOUT);

      const params = {
        FunctionName: arn,
        Payload: JSON.stringify(payload),
      };

      const genericCallback = (err: any, data: any) => {
        if (err) {
          clearTimeout(timeout);
          reject(err);
        } else {
          clearTimeout(timeout);
          resolve(data);
        }
      };
      lambda.invoke(params, genericCallback);
    });
  };

  const lambdaService = createService();
  return await invokeLambda(lambdaService, props.arn, props.payload);
};

export default invokeAWSLambda;
