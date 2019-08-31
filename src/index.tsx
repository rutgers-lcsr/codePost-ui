import * as React from "react";

// @ts-ignore
import {
  Badge,
  Button,
  Dropdown,
  Icon,
  Input,
  InputNumber,
  Layout,
  Menu,
  Popover,
  Table,
  Tooltip
} from "antd";

import "./styles/main.scss";

import * as ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import "typeface-lato";
import "typeface-muli";
import "typeface-pt-mono";

import * as serviceWorker from "./serviceWorker";

// @ts-ignore
import CPLayoutGrade from "./components/core/CPLayoutGrade";

// @ts-ignore
import CPLayoutAdmin from "./components/core/CPLayoutAdmin";

import App from "./App";

import ErrorBoundary from "./components/core/ErrorBoundary";

ReactDOM.render(
  <ErrorBoundary type="app">
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>,
  document.getElementById("root") as HTMLElement
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
