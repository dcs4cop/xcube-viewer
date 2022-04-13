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

import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Paper from '@material-ui/core/Paper';
import React from 'react';
import i18n from '../i18n';

import * as auth from '../util/auth';
import { WithLocale } from '../util/lang';


interface UserProfileProps extends WithLocale {
    userProfile: auth.UserProfile;
    accessToken: string | null;
}

const UserProfile: React.FC<UserProfileProps> = ({userProfile}) => {

    return (
        <Grid container justify="center" spacing={1}>
            <Grid item>
                <img src={userProfile.picture} width={84} alt={i18n.get('User Profile')}/>
            </Grid>
            <Grid item>
                <Paper elevation={3}>
                    <List>
                        <ListItem>
                            <ListItemText
                                primary={userProfile.name}
                                secondary={i18n.get('User name')}/>
                        </ListItem>
                        <Divider light/>
                        <ListItem>
                            <ListItemText
                                primary={`${userProfile.email} (${userProfile.email_verified ? i18n.get('verified') : i18n.get('not verified')})`}
                                secondary={i18n.get('E-mail')}/>
                        </ListItem>
                        <Divider light/>
                        <ListItem>
                            <ListItemText
                                primary={userProfile.nickname}
                                secondary={i18n.get('Nickname')}/>
                        </ListItem>
                    </List>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default UserProfile;