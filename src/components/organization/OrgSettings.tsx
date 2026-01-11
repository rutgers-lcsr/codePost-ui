import * as React from 'react';
import { Form, Switch, Select, Button, message, Input, Card, Space, Alert } from 'antd';
import { UserType } from '../../infrastructure/user';
import { Organization } from '../../infrastructure/organization';

interface IProps {
  user: UserType;
}

const OrgSettings: React.FC<IProps> = (props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [provider, setProvider] = React.useState<string>('CAS');

  React.useEffect(() => {
    const loadOrg = async () => {
      if (props.user.organization) {
        try {
          const orgData = await Organization.read(props.user.organization);
          setProvider(orgData.sso_provider || 'CAS');

          // Parse config to populate fields
          const config = orgData.sso_config || {};

          form.setFieldsValue({
            emailDomain: orgData.emailDomain,
            sso_enabled: orgData.sso_enabled,
            sso_provider: orgData.sso_provider || 'CAS',
            send_welcome_email: orgData.send_welcome_email,
            ...config, // Spread config keys directly into form
          });
        } catch (e) {
          console.error('Failed to load organization', e);
          message.error('Failed to load organization details');
        }
      }
    };
    loadOrg();
  }, [props.user.organization, form]);

  const onProviderChange = (value: string) => {
    setProvider(value);
  };

  const onFinish = async (values: any) => {
    if (!props.user.organization) return;

    setLoading(true);
    try {
      // Reconstruct sso_config from flat fields based on provider
      let config: any = {};

      if (values.sso_provider === 'CAS') {
        config = {
          cas_server_url: values.cas_server_url,
          cas_version: values.cas_version,
        };
      } else if (values.sso_provider === 'AZURE') {
        config = {
          tenant_id: values.tenant_id,
          client_id: values.client_id,
          client_secret: values.client_secret,
        };
      } else if (values.sso_provider === 'OIDC') {
        config = {
          discovery_url: values.discovery_url,
          client_id: values.client_id,
          client_secret: values.client_secret,
        };
      } else if (values.sso_provider === 'GOOGLE') {
        config = {
          client_id: values.client_id,
          client_secret: values.client_secret,
          hosted_domain: values.hosted_domain,
        };
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${props.user.organization}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          emailDomain: values.emailDomain,
          sso_enabled: values.sso_enabled,
          sso_provider: values.sso_provider,
          send_welcome_email: values.send_welcome_email,
          sso_config: config,
        }),
      });

      if (response.ok) {
        message.success('Settings updated successfully');
        // const updated = await response.json();
      } else {
        message.error('Failed to update settings');
      }
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
        return <Alert message="Select a provider to configure" type="info" />;
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
      <h2>Organization Settings</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          sso_enabled: false,
          send_welcome_email: true,
          sso_provider: 'CAS',
        }}
      >
        <div
          style={{ marginBottom: 24, border: '1px solid #f0f0f0', padding: 24, borderRadius: 8, background: '#fff' }}
        >
          <h3>Email Settings</h3>
          <Form.Item
            name="emailDomain"
            label="Allowed Email Domain"
            help="The email domain associated with this organization (e.g. valid-user@university.edu). Used for SSO user creation."
          >
            <Input placeholder="university.edu" />
          </Form.Item>

          <Form.Item
            name="send_welcome_email"
            label="Send Welcome Emails"
            valuePropName="checked"
            help="If disabled, users added to this organization via roster upload will NOT receive a welcome email by default."
          >
            <Switch />
          </Form.Item>
        </div>

        <div
          style={{ marginBottom: 24, border: '1px solid #f0f0f0', padding: 24, borderRadius: 8, background: '#fff' }}
        >
          <h3>SSO Configuration</h3>
          <div style={{ marginBottom: 16 }}>
            <Form.Item
              name="sso_enabled"
              label="Enable SSO Activation"
              valuePropName="checked"
              help="If enabled, new users added to this organization are automatically activated."
            >
              <Switch />
            </Form.Item>
          </div>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item name="sso_provider" label="SSO Provider">
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
