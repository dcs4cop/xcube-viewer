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

import { DialogContent } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';


const useStyles = makeStyles((theme: Theme) => createStyles(
    {
        dialog: {
            backgroundColor: theme.palette.grey[600]
        },
        appBar: {
            position: 'relative',
        },
        title: {
            marginLeft: theme.spacing(2),
            flex: 1,
        },
        text: {
            marginTop: theme.spacing(4),
            marginLeft: theme.spacing(40),
            marginRight: theme.spacing(40),
        }
    }
));

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface MarkdownPageProps {
    title: string;
    href: string;
    open: boolean;
    onClose: () => void;
}

const MarkdownPage: React.FC<MarkdownPageProps> = ({
                                                       title,
                                                       href,
                                                       open,
                                                       onClose
                                                   }) => {
    const [imprintText, setImprintText] = useState('');

    useEffect(() => {
        // fetch(window.location.href + href)
        fetch(href)
            .then(response => response.text())
            .then(imprintText => setImprintText(imprintText));
    });

    const classes = useStyles();

    return (
        <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition as any}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
                        <CloseIcon/>
                    </IconButton>
                    <Typography variant="h6" className={classes.title}>{title}</Typography>
                </Toolbar>
            </AppBar>
            <DialogContent className={classes.dialog}>
                <div className={classes.text}>
                    <Markdown source={imprintText} linkTarget="_blank"/>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MarkdownPage;
