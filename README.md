# xcube Viewer

A simple viewer component for [xcube](https://xcube.readthedocs.io/).

![xcube-viewer](./doc/xcube-viewer.jpg)

## Run it

Note, there is no need to install xcube Viewer on its own.
It is bundled with the [xcube](https://github.com/dcs4cop/xcube)
Python package since version 1.0. Just run
```bash
xcube serve -c server-config.yaml
```
and access the viewer via the server endpoint `/viewer`,
hence http://127.0.0.1/viewer, when run without URL prefix.

For development or for independent deployment, please read ahead to

1. install [xcube](https://github.com/dcs4cop/xcube) and run server in demo mode;
2. install and start `xcube-viewer` with demo configuration.

### Install `xcube` in development mode

`xcube` one-time install:

    $ git clone https://github.com/dcs4cop/xcube.git
    $ cd xcube
    $ conda env create
    $ conda activate xcube
    $ python setup.py develop  

`xcube` update and run server:

    $ cd xcube
    $ git pull
    $ conda activate xcube  
    $ xcube serve --verbose --traceperf --config xcube/examples/serve/demo/config.yml  

If errors occur, you may need to update the environment:

    $ conda env update

### Install and run `xcube-viewer` in development mode

Checkout `xcube-viewer` sources:

    $ git clone https://github.com/dcs4cop/xcube-viewer.git
    $ cd xcube-viewer
    $ yarn install
    $ yarn start

Update, install, and run:

    $ cd xcube-viewer
    $ git pull
    $ yarn install
    $ yarn start

Build `xcube-viewer` for deployment with `default` branding:

    $ cd xcube-viewer
    $ git pull
    $ yarn build

Find outputs in `./build`.

### Update `xcube` by a new `xcube-viewer` build

To bundle the `xcube` package with a new `xcube-viewer` version first build 
`xcube-viewer` as described above.
Then, in the xcube repo checked out from GitHub replace the contents the 
`xcube/webapi/viewer/data` directory with the contents of the `./build` 
directory. Note, it is important to replace the contents, 
do not just copy. 
Finally, add new files to git and commit all changes.  

## More

* [User Guide](https://xcube.readthedocs.io/en/latest/viewer.html#)
* [Planned Enhancements](https://github.com/dcs4cop/xcube-viewer/labels/enhancement)
* [Known Issues](https://github.com/dcs4cop/xcube-viewer/labels/bug)

--- 


This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) v3.3.0.

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more
information.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will
remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right
into your project so you have full control over them. All of the commands except `eject` will still work, but they will
point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you
shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t
customize it when you are ready for it.

## Learn More

You can learn more in
the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).



