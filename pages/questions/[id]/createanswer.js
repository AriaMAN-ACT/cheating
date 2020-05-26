import {useState} from 'react';
import Cookie from "js-cookie";
import Router from "next/router";

import cheating from "../../../api/cheating";
import BasePage from "../../../components/BasePage";
import {Field, Form, Formik} from "formik";
import Input from "../../../components/Input";

const INITIAL_VALUES = {
    value: ''
};

const CreateQuestion = ({question, auth}) => {
    if (process.browser && !auth.isSignedIn) {
        Router.push('/');
        return (<div/>);
    }
    if (!auth.isSignedIn) {
        return (<div/>);
    }
    if (process.browser && !question) {
        Router.push('/dashboard');
        return (<div/>);
    }
    if (!question) {
        return (<div/>);
    }

    const [error, setError] = useState('');

    const validate = values => {
        const errors = {};

        Object.entries(values).forEach(([key, value]) => {
            if (!value) {
                errors[key] = `${key} is required.`;
            }
        });

        return errors;
    };

    const onSubmit = (values, {setSubmitting}) => {
        setSubmitting(true);
        let answer;
        cheating.post('/answers', values)
            .then(res => {
                answer = res.data.data.doc;
                const newQuestion = {...question};
                newQuestion.answers.push(answer._id);
                newQuestion._id = undefined;
                cheating.patch(`/questions/${question._id}`, newQuestion).then(res => {
                    Router.push(`/questions/${question._id}`);
                }).catch(err => {
                    setError(err.response.data.message);
                    setSubmitting(false);
                });
            })
            .catch(err => {
                setError(err.response.data.message);
                setSubmitting(false);
            });
    };

    return (
        <BasePage title="Create Answer">
            <div className="form-container">
                <Formik
                    initialValues={INITIAL_VALUES}
                    validate={validate}
                    onSubmit={onSubmit}>
                    {({
                          isSubmitting,
                          handleSubmit
                      }) => (
                        <Form onSubmit={handleSubmit}>
                            <Field type="text" name="value" component={Input} label="Answer"/>
                            <div className="error">{error}</div>
                            <button type="submit" disabled={isSubmitting}>
                                Create Answer
                            </button>
                        </Form>
                    )}
                </Formik>
            </div>
        </BasePage>
    );
};

CreateQuestion.getInitialProps = async context => {
    const token = ((context.req || {}).cookies || {}).jwt || Cookie.get('jwtClient');
    let question;
    try {
        const res = await cheating.get(`/questions/${context.query.id}`, {
            headers: {
                Authorization: token
            }
        });
        question = res.data.data.doc;
    } catch (err) {
        question = undefined;
    }
    return {
        question
    };
};

export default CreateQuestion;