import * as React from 'react';

/* other library imports */
import Select from 'react-select';

import Fuse from 'fuse.js';

import { Breadcrumb, Icon, Modal } from 'antd';

import useHotkeys, { ESCAPE_KEY, K_KEY } from '../code-review/useHotkeys';

import { osControlKey } from '../core/operatingSystem';

/*******************************************************************************/

// To-do List:
// (1) escape to revert to previous query (all the way back)
// (2) optional shortcut specification
// (3) icon to specify what type of query
//     - action
//     - link

interface IOptionType {
  value: string /* what gets searched */;
  label: string /* what is displayed in the bar */;
}

interface IQueryType extends IOptionType {
  /* what gets called when a value is selected */
  callback?: (value: string) => void;
  generator?: (value: string) => Promise<IQueryType[]>;

  isDynamic?: boolean;
  confirm?: boolean;
  confirmText?: string;
  isList?: boolean;
}

type IParameterList = Record<string, string[]>;

type IHistoryType = Array<{ searchText: string; options: IQueryType[] }>;

/* build a Fuse object for fuzzy matching on options */
const buildFuse = (options: IOptionType[], threshold: number) => {
  return new Fuse(options, { threshold: threshold, keys: ['label', 'tags'], shouldSort: true });
};

interface IPropsType {
  queryMap: IQueryType[];
  parameters?: IParameterList;
}

const genericGenerator = (query: IQueryType, parameters: IParameterList): IQueryType[] => {
  const extractedParameters = query.label.match(/{{.*}}/g);
  if (extractedParameters === null || extractedParameters.length !== 1) {
    throw 'query.label does not include a single parameter (0 or >1).';
  } else {
    const parameter = extractedParameters[0].substring(2, extractedParameters[0].length - 2);
    const options = parameters[parameter];
    if (options === undefined) {
      throw `${parameter} is not specified in parameters input.`;
    } else {
      return options.map((option) => {
        return {
          value: option,
          label: query.label.replace(/{{.*}}/g, option),
          callback: query.callback,
          generator: query.generator !== undefined ? query.generator.bind(false, option) : undefined,
          isList: query.isList,
        };
      });
    }
  }

  return [];
};

const Foobar = (props: IPropsType) => {
  /******************************************************************/
  /* is Foobar visible in the DOM? */
  const [visible, setVisible] = React.useState(false);

  /* are we performing some async action? */
  const [loading, setLoading] = React.useState(false);

  /* what options are displayed in the select? */
  const [options, setOptions] = React.useState(props.queryMap);
  const [oldOptions, setOldOptions] = React.useState([] as IHistoryType);

  /* what has the user typed? */
  const [searchText, setSearchText] = React.useState('');

  /* which options do we claim match the user's searchText? */
  const [filteredOptions, setFilteredOptions] = React.useState(props.queryMap);

  /* the prefix text of the active dynamic query. Empty string if no
  query is active */
  const [dynamicPrefix, setDynamicPrefix] = React.useState('');
  /******************************************************************/

  const refContainer: any = React.useRef(null);

  // We need to update what is showin the bar's menu when either
  // (a) the baseline options change (e.g. because of entering or exiting
  // a dynamic query) or (b) the user changes the text in the bar.
  React.useEffect(() => {
    const fuse = buildFuse(options, 0.3);
    const matches = fuse.search(searchText.substr(dynamicPrefix.length));

    // Could also just show no matches here. Not sure which is more frustrating.
    setFilteredOptions(matches.length > 0 ? matches : options);
  }, [options, searchText]);

  // As user types, we need to figure out whether to enter or exit a dynamic query
  React.useEffect(() => {
    // Definition: we are "in" an active query if the searchText (fuzzily) contains
    // the full text of one single dynamic query
    const matches = props.queryMap.filter((record) => {
      return searchText
        .toUpperCase()
        .replace(' ', '')
        .includes(record.value.toUpperCase().replace(' ', ''));
    });

    if (matches.length === 1) {
      // If the query is dynamic and isn't already active, make it active
      const loneMatch = matches[0];
      if (loneMatch.value !== dynamicPrefix && loneMatch.isDynamic) {
        const newOptions = genericGenerator(loneMatch, props.parameters!);
        setOldOptions([...oldOptions, { searchText: loneMatch.label, options }]);
        setOptions(newOptions);
        setDynamicPrefix(loneMatch.value);
      }
    } else {
      // If we could activate multiple queries, show the original menu options
      setDynamicPrefix('');
    }
  }, [searchText]);

  /* control visibility of cmd component */
  const onChange = () => {
    setVisible(!visible);
    setOptions(props.queryMap);
    setOldOptions([]);
    if (!visible && refContainer.current !== null) {
      // Autofocus whenever the bar is mounted
      refContainer.current.focus();

      // Clear any existing searches
      setDynamicPrefix('');
    }
  };

  const revertOptions = () => {
    if (oldOptions.length > 0) {
      const copiedOldOptions = [...oldOptions];
      const toRevert = copiedOldOptions.pop();
      setOldOptions(copiedOldOptions);
      setOptions(toRevert!.options);
      onInputChange('');
    }
  };

  useHotkeys(K_KEY, onChange);
  useHotkeys(K_KEY, revertOptions, true);

  const onInputChange = (searchValue: string) => {
    setSearchText(searchValue);
  };

  /* if the user selects on option, handle it appropriaetly */
  const onInputSelect = async (record: IQueryType) => {
    /* when option is selected a second time, execute callback */
    if (searchText === record.label) {
      if (record.isList && record.generator !== undefined) {
        setLoading(true);
        const newOptions = await record.generator(record.value);
        setLoading(false);
        setDynamicPrefix('');
        onInputChange('');
        setOldOptions([...oldOptions, { searchText: `{{${record.value}}}`, options }]);
        setOptions(newOptions);
        return;
      } else {
        if (record.callback !== undefined) {
          setVisible(false);
          if (record.confirm) {
            Modal.confirm({
              title: record.confirmText ? record.confirmText : 'Are you sure?',
              onOk() {
                return new Promise((resolve, reject) => {
                  return resolve(record.callback!(record.value));
                }).catch(() => console.log('Oops errors!'));
              },
              onCancel() {},
            });
          } else {
            record.callback(record.value);
          }
        }
      }
    }

    // Set placeholder text, but remove any placeholders present
    // We call this regardless of whether the callback is executed above,
    // because we want the selected text to remain in the searchbar on every select
    onInputChange(record.label.replace(/{{.*}}/g, ''));
  };

  return (
    <Modal
      visible={visible}
      footer={null}
      mask={false}
      title={
        <span>
          <span>Foobar</span>
          <span style={{ color: '#ccc', float: 'right' }}>&nbsp; [{osControlKey()} k to close]</span>
        </span>
      }
      onCancel={onChange}
      closable={false}
    >
      <Breadcrumb style={{ fontSize: 12 }}>
        <Breadcrumb.Item>
          <Icon type="home" />
        </Breadcrumb.Item>
        {oldOptions.map((el) => {
          return <Breadcrumb.Item>{el.searchText}</Breadcrumb.Item>;
        })}
      </Breadcrumb>
      <div style={{ height: 3 }} />
      <Select
        onInputChange={onInputChange}
        onChange={onInputSelect}
        autoFocus
        options={filteredOptions}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
        ref={refContainer}
        placeholder={'Type a command or question'}
        closeMenuOnSelect={false}
        inputValue={searchText}
        value={null}
        menuIsOpen={true}
        filterOption={() => true}
        loading={loading}
      />
    </Modal>
  );
};

export default Foobar;
