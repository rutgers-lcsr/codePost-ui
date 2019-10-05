import * as React from 'react';

/* other library imports */
import Select from 'react-select';

import Fuse from 'fuse.js';

import { Modal } from 'antd';

import useHotkeys, { K_KEY } from '../code-review/useHotkeys';

import { osControlKey } from '../core/operatingSystem';

/*******************************************************************************/

interface IOptionType {
  value: string /* what gets searched */;
  label: string /* what is displayed in the bar */;
}

interface IQueryType extends IOptionType {
  /* what gets called when a value is selected */
  callback?: (value?: string) => void;

  /* Produces options to fill in a variable within a dynamic query */
  /* Example:
   *    - Dynamic query: "Increment {{variable}}"
   *    - When the user types in "Increment" or selects "Increment {{variable}}",
   *      genOptions will produce the following queries for the user to select
   *          - "Increment fizz"
   *          - "Increment buzz"
   *          - "Increment bazz"
   */

  genQueries?: (value?: string) => IOptionType[];
}

/* build a Fuse object for fuzzy matching on options */
const buildFuse = (options: IOptionType[], threshold: number) => {
  return new Fuse(options, { threshold: threshold, keys: ['value'], shouldSort: true });
};

interface IPropsType {
  queryMap: IQueryType[];
}

const Foobar = (props: IPropsType) => {
  /******************************************************************/
  /* is Foobar visible in the DOM? */
  const [visible, setVisible] = React.useState(false);

  /* what options are displayed in the select? */
  const [options, setOptions] = React.useState(props.queryMap);

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
      if (loneMatch.value !== dynamicPrefix && loneMatch.genQueries !== undefined) {
        const newOptions = loneMatch.genQueries();
        setOptions(newOptions);
        setDynamicPrefix(loneMatch.value);
      }
    } else {
      // If we could activate multiple queries, show the original menu options
      setOptions(props.queryMap);
      setDynamicPrefix('');
    }
  }, [searchText]);

  /* control visibility of cmd component */
  const onChange = () => {
    setVisible(!visible);
    setOptions(props.queryMap);
    if (!visible && refContainer !== null) {
      // Autofocus whenever the bar is mounted
      refContainer.current.focus();

      // Clear any existing searches
      setSearchText('');
      setDynamicPrefix('');
    }
  };

  useHotkeys(K_KEY, onChange);

  const onInputChange = (searchValue: string) => {
    setSearchText(searchValue);
  };

  /* if the user selects on option, handle it appropriaetly */
  const onInputSelect = (record: IQueryType) => {
    /* when option is selected a second time, execute callback */
    if (searchText === record.label && record.callback !== undefined) {
      record.callback(record.value);
      setVisible(false);
    } else {
      // Set placeholder text, but remove any placeholders present
      onInputChange(record.label.replace(/{{.*}}/g, ''));
    }
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
      />
    </Modal>
  );
};

export default Foobar;
