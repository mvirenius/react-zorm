import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { z } from "zod";
import { useZorm, Zorm } from "react-zorm";

const FormSchema = z.object({
    meta: z.object({
        listName: z.string().min(1),
    }),
    todos: z.array(
        z.object({
            task: z.string().min(1),
            priority: z
                .string()
                .refine(
                    (val) => {
                        return /^[0-9]+$/.test(val.trim());
                    },
                    { message: "must use  positive numbers" },
                )
                .transform((s) => {
                    return Number(s);
                }),
        }),
    ),
});

function renderError(props: { message: string }) {
    return <div className="error-message">{props.message}</div>;
}

function TodoItem(props: { zorm: Zorm<typeof FormSchema>; index: number }) {
    const { fields, errors } = props.zorm;

    return (
        <fieldset>
            Task <br />
            <input
                type="text"
                name={fields.todos(props.index).task()}
                className={errors.todos(props.index).task("errored")}
            />
            {errors.todos(props.index).task(renderError)}
            <br />
            Priority <br />
            <input
                type="text"
                name={fields.todos(props.index).priority()}
                className={errors.todos(props.index).priority("errored")}
            />
            {errors.todos(props.index).priority(renderError)}
        </fieldset>
    );
}

function TodoList() {
    const zo = useZorm("todos", FormSchema);
    const canSubmit = !zo.validation || zo.validation?.success === true;
    const [todos, setTodos] = useState(1);
    const addTodo = () => setTodos((n) => n + 1);

    const range = Array(todos)
        .fill(0)
        .map((_, i) => i);

    return (
        <form
            {...zo.props({
                onSubmit(e) {
                    e.preventDefault();
                    if (zo.validation?.success) {
                        alert("Form ok!");
                    }
                },
            })}
        >
            <h1>Todo List</h1>
            List name
            <br />
            <input
                type="text"
                name={zo.fields.meta.listName()}
                className={zo.errors.meta.listName("errored")}
            />
            {zo.errors.meta.listName(renderError)}
            <h2>Todos</h2>
            {range.map((index) => (
                <TodoItem key={index} index={index} zorm={zo} />
            ))}
            <button type="button" onClick={addTodo}>
                Add todo
            </button>
            <div>
                <button disabled={!canSubmit} type="submit">
                    Submit all
                </button>
            </div>
            <pre>
                Validation status: {JSON.stringify(zo.validation, null, 2)}
            </pre>
        </form>
    );
}

ReactDOM.render(<TodoList />, document.getElementById("app"));
