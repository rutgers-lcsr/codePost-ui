// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Form, Switch, Select, Button, message, Input, Card, Space, Alert, Typography } from 'antd';
import type { UserType } from '../../types/models';
import { organizationsApi } from '../../api-client/clients';

interface IProps {
  user: UserType;
}

interface OrgSettingsFormValues {
  emailDomain?: string | null;
  allowedEmailDomains?: string[];
  ssoEnabled?: boolean;
  ssoProvider?: string | null;
  sendWelcomeEmail?: boolean;
  cas_server_url?: string;
  cas_version?: string;
  tenant_id?: string;
  client_id?: string;
  client_secret?: string;
  discovery_url?: string;
  hosted_domain?: string;
}

const OrgSettings: React.FC<IProps> = (props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [provider, setProvider] = React.useState<string>('CAS');

  // Use singleton instance
  const api = organizationsApi;

  React.useEffect(() => {
    const loadOrg = async () => {
      if (props.user.organization) {
        try {
          const orgData = await api.retrieve({ id: props.user.organization });
          setProvider(orgData.ssoProvider || 'CAS');

          // Parse config to populate fields
          const config = orgData.ssoConfig || {};

          form.setFieldsValue({
            emailDomain: orgData.emailDomain,
            allowedEmailDomains: orgData.allowedEmailDomains || [],
            ssoEnabled: orgData.ssoEnabled,
            ssoProvider: orgData.ssoProvider || 'CAS',
            sendWelcomeEmail: orgData.sendWelcomeEmail,
            ...config, // Spread config keys directly into form (assuming they match config field names)
          });
        } catch (e) {
          console.error('Failed to load organization', e);
          message.error('Failed to load organization details');
        }
      }
    };
    loadOrg();
  }, [props.user.organization, form, api]);

  const onProviderChange = (value: string) => {
    setProvider(value);
  };

  const onFinish = async (values: OrgSettingsFormValues) => {
    if (!props.user.organization) return;

    setLoading(true);
    try {
      // Reconstruct sso_config from flat fields based on provider
      let config: Record<string, unknown> = {};

      if (values.ssoProvider === 'CAS') {
        config = {
          cas_server_url: values.cas_server_url,
          cas_version: values.cas_version,
        };
      } else if (values.ssoProvider === 'AZURE') {
        config = {
          tenant_id: values.tenant_id,
          client_id: values.client_id,
          client_secret: values.client_secret,
        };
      } else if (values.ssoProvider === 'OIDC') {
        config = {
          discovery_url: values.discovery_url,
          client_id: values.client_id,
          client_secret: values.client_secret,
        };
      } else if (values.ssoProvider === 'GOOGLE') {
        config = {
          client_id: values.client_id,
          client_secret: values.client_secret,
          hosted_domain: values.hosted_domain,
        };
      }

      await api.partialUpdate({
        id: props.user.organization,
        patchedOrganization: {
          emailDomain: values.emailDomain,
          allowedEmailDomains: values.allowedEmailDomains || [],
          ssoEnabled: values.ssoEnabled,
          ssoProvider: values.ssoProvider,
          sendWelcomeEmail: values.sendWelcomeEmail,
          ssoConfig: config,
        },
      });

      message.success('Settings updated successfully');
    } catch (e) {
      console.error(e);
      message.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderConfigFields = () => {
    switch (provider) {
      case 'CAS':
        return (
          <>
            <Form.Item
              name="cas_server_url"
              label="CAS Server URL"
              rules={[{ required: true, message: 'CAS Server URL is required' }]}
              help="The base URL of your CAS server (e.g., https://cas.university.edu)"
            >
              <Input placeholder="https://cas.university.edu" />
            </Form.Item>
            <Form.Item name="cas_version" label="CAS Protocol Version" initialValue="3">
              <Select>
                <Select.Option value="2">CAS 2.0</Select.Option>
                <Select.Option value="3">CAS 3.0</Select.Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'AZURE':
        return (
          <>
            <Form.Item name="tenant_id" label="Tenant ID" rules={[{ required: true }]}>
              <Input placeholder="Azure AD Tenant ID" />
            </Form.Item>
            <Form.Item name="client_id" label="Client ID" rules={[{ required: true }]}>
              <Input placeholder="Application (Client) ID" />
            </Form.Item>
            <Form.Item name="client_secret" label="Client Secret" rules={[{ required: true }]}>
              <Input.Password placeholder="Client Secret" />
            </Form.Item>
          </>
        );
      case 'OIDC':
        return (
          <>
            <Form.Item name="discovery_url" label="Discovery URL" rules={[{ required: true }]}>
              <Input placeholder="https://provider.com/.well-known/openid-configuration" />
            </Form.Item>
            <Form.Item name="client_id" label="Client ID" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="client_secret" label="Client Secret" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          </>
        );
      case 'GOOGLE':
        return (
          <>
            <Form.Item name="client_id" label="Client ID" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="client_secret" label="Client Secret" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="hosted_domain"
              label="Hosted Domain (Optional)"
              help="Restrict login to a specific domain (e.g. university.edu)"
            >
              <Input placeholder="university.edu" />
            </Form.Item>
          </>
        );
      default:
        return <Alert title="Select a provider to configure" type="info" />;
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
      <Typography.Title level={1}>Organization Settings</Typography.Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          ssoEnabled: false,
          sendWelcomeEmail: true,
          ssoProvider: 'CAS',
        }}
      >
        <div
          style={{ marginBottom: 24, border: '1px solid #f0f0f0', padding: 24, borderRadius: 8, background: '#fff' }}
        >
          <Typography.Title level={2}>Email Settings</Typography.Title>
          <Form.Item
            name="emailDomain"
            label="Allowed Email Domain (Primary)"
            help="The primary email domain for this organization. Used to convert bare usernames to emails during SSO login (e.g. a CAS NetID 'jsmith' becomes 'jsmith@university.edu'). Also used for SSO organization lookup."
          >
            <Input placeholder="university.edu" />
          </Form.Item>

          <Form.Item
            name="allowedEmailDomains"
            label="Additional Allowed Email Domains"
            help="Additional email domains that should route to this organization's SSO (e.g. subdomains like scarletmail.rutgers.edu). Press Enter after each domain."
          >
            <Select
              mode="tags"
              placeholder="e.g. scarletmail.university.edu"
              tokenSeparators={[',', ' ', '\n']}
              style={{ width: '100%' }}
              notFoundContent={null}
            />
          </Form.Item>

          <Form.Item
            name="sendWelcomeEmail"
            label="Send Welcome Emails"
            valuePropName="checked"
            help="If disabled, users added to this organization via roster upload will NOT receive a welcome email by default."
          >
            <Switch aria-label="Send welcome emails" />
          </Form.Item>
        </div>

        <div
          style={{ marginBottom: 24, border: '1px solid #f0f0f0', padding: 24, borderRadius: 8, background: '#fff' }}
        >
          <Typography.Title level={2}>SSO Configuration</Typography.Title>
          <div style={{ marginBottom: 16 }}>
            <Form.Item
              name="ssoEnabled"
              label="Enable SSO Activation"
              valuePropName="checked"
              help="If enabled, new users added to this organization are automatically activated."
            >
              <Switch aria-label="Enable SSO activation" />
            </Form.Item>
          </div>

          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item name="ssoProvider" label="SSO Provider">
              <Select onChange={onProviderChange}>
                <Select.Option value="CAS">CAS</Select.Option>
                <Select.Option value="AZURE">Azure AD</Select.Option>
                <Select.Option value="OIDC">OIDC</Select.Option>
                <Select.Option value="GOOGLE">Google Workspace</Select.Option>
              </Select>
            </Form.Item>

            <Card size="small" title={`${provider} Configuration`} style={{ background: '#fafafa' }}>
              {renderConfigFields()}
            </Card>
          </Space>
        </div>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large">
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default OrgSettings;
