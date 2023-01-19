/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019-2021 by the xcube development team and contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import * as Redux from 'redux';
import * as ReduxLogger from 'redux-logger';
import thunk from 'redux-thunk';

import './index.css';
import { changeLocale } from './actions/controlActions';
import { syncWithServer, checkServerUpdate } from './actions/dataActions';
import { Config } from './config';
import App from './connected/App';
import { appReducer } from './reducers/appReducer';
import * as serviceWorker from './serviceWorker';


Config.load().then(() => {
    const logger = ReduxLogger.createLogger({collapsed: true, diff: false});
    const store = Redux.createStore(appReducer, Redux.applyMiddleware(thunk, logger));

    store.dispatch(changeLocale(store.getState().controlState.locale) as any);

    window.setInterval(() => store.dispatch(checkServerUpdate() as any), 1000);

    if (store.getState().controlState.privacyNoticeAccepted) {
        store.dispatch(syncWithServer() as any);
    }

    ReactDOM.render(
        <Provider store={store}>{<App/>}</Provider>,
        document.getElementById('root') as HTMLElement
    );

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://bit.ly/CRA-PWA
    serviceWorker.unregister();
});
