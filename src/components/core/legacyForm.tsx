// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { createContext, forwardRef, useContext, useEffect, useRef } from 'react';
import { Form as AntdForm } from 'antd';
import type { FormInstance, FormItemProps, FormProps } from 'antd';

const LegacyFormContext = createContext<FormInstance | null>(null);

type DecoratorOptions = {
  initialValue?: FormItemProps['initialValue'];
  rules?: FormItemProps['rules'];
  valuePropName?: FormItemProps['valuePropName'];
};

export interface LegacyFormController {
  getFieldDecorator: (name: string, options?: DecoratorOptions) => (node: React.ReactElement) => React.ReactElement;
  setFieldsValue: FormInstance['setFieldsValue'];
  getFieldValue: FormInstance['getFieldValue'];
  validateFields: (callback: (err: any, values: any) => void) => void;
  resetFields: FormInstance['resetFields'];
}

type WrappedComponentRef = ((instance: any) => void) | React.MutableRefObject<any>;

type CreateOptions = {
  name?: string;
};

const create = (options?: CreateOptions) => {
  return (Component: React.ComponentType<any>) => {
    const Wrapped = forwardRef<any, any>((props, ref) => {
      const { wrappedComponentRef, ...rest } = props as { wrappedComponentRef?: WrappedComponentRef } & Record<
        string,
        unknown
      >;
      const [form] = AntdForm.useForm();
      const innerRef = useRef<any>(null);

      React.useImperativeHandle(ref, () => innerRef.current);

      useEffect(() => {
        if (!wrappedComponentRef) {
          return;
        }
        if (typeof wrappedComponentRef === 'function') {
          wrappedComponentRef(innerRef.current);
        } else {
          // eslint-disable-next-line react-hooks/immutability -- legacy ref forwarding shim
          wrappedComponentRef.current = innerRef.current;
        }
      }, [wrappedComponentRef]);

      const getFieldDecorator: LegacyFormController['getFieldDecorator'] = (name, decoratorOptions = {}) => {
        const { initialValue, rules, valuePropName } = decoratorOptions;
        return (node) => (
          <AntdForm.Item
            name={name}
            initialValue={initialValue}
            rules={rules}
            valuePropName={valuePropName as FormItemProps['valuePropName']}
          >
            {node}
          </AntdForm.Item>
        );
      };

      const legacyForm: LegacyFormController = {
        getFieldDecorator,
        setFieldsValue: form.setFieldsValue,
        getFieldValue: form.getFieldValue,
        validateFields: (callback) => {
          form
            .validateFields()
            .then((values) => callback(null, values))
            .catch((err) => callback(err.errorFields, form.getFieldsValue()));
        },
        resetFields: form.resetFields,
      };

      const componentProps = { ...rest, form: legacyForm } as any;

      return (
        <LegacyFormContext.Provider value={form}>
          <Component {...componentProps} ref={innerRef} />
        </LegacyFormContext.Provider>
      );
    });

    Wrapped.displayName = options?.name || Component.displayName || Component.name || 'LegacyFormWrapper';

    return Wrapped as any;
  };
};

const Form = (props: FormProps) => {
  const contextForm = useContext(LegacyFormContext);
  const { children, form: overriddenForm, ...rest } = props;
  const resolvedForm = overriddenForm ?? contextForm ?? undefined;

  return (
    <AntdForm {...rest} form={resolvedForm}>
      {children as any}
    </AntdForm>
  );
};

Form.Item = AntdForm.Item;
Form.create = create;

export default Form;
