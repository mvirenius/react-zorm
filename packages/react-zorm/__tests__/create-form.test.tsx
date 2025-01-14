import React from "react";
import { assertNotAny, makeForm } from "./test-helpers";
import { z } from "zod";
import { parseForm } from "../src/parse-form";
import { FieldChainFromSchema, SimpleSchema } from "../src/types";
import { fieldChain } from "../src/chains";

function createFields<Schema extends SimpleSchema>(
    formName: string,
    schema: Schema,
): FieldChainFromSchema<Schema> {
    return fieldChain(formName);
}

test("single field", () => {
    const FormValues = z.object({
        ding: z.string(),
    });

    const fields = createFields("test", FormValues);

    const form = makeForm(
        <form>
            <input name={fields.ding()} defaultValue="dong" />
        </form>,
    );

    const values = parseForm(FormValues, form);

    expect(values).toEqual({
        ding: "dong",
    });

    assertNotAny(values.ding);
});

test("object", () => {
    const FormValues = z.object({
        ob: z.object({
            ding: z.string(),
            dong: z.string(),
        }),
    });

    const fields = createFields("test", FormValues);

    const form = makeForm(
        <form>
            <input name={fields.ob.ding()} defaultValue="value1" />
            <input name={fields.ob.dong()} defaultValue="value2" />
        </form>,
    );

    const values = parseForm(FormValues, form);

    expect(values).toEqual({
        ob: {
            ding: "value1",
            dong: "value2",
        },
    });
});

test("array of objects", () => {
    const FormValues = z.object({
        things: z.array(
            z.object({
                ding: z.string(),
            }),
        ),
    });

    const fields = createFields("test", FormValues);

    const form = makeForm(
        <form>
            <input name={fields.things(0).ding()} defaultValue="value1" />
            <input name={fields.things(1).ding()} defaultValue="value2" />
        </form>,
    );

    const values = parseForm(FormValues, form);

    expect(values).toEqual({
        things: [
            //
            { ding: "value1" },
            { ding: "value2" },
        ],
    });
});

test("array of strings", () => {
    const FormValues = z.object({
        ob: z.object({
            strings: z.array(z.string()),
        }),
    });

    const fields = createFields("test", FormValues);
    const form = makeForm(
        <form>
            <input name={fields.ob.strings(0)()} defaultValue="value1" />
            <input name={fields.ob.strings(1)()} defaultValue="value2" />
        </form>,
    );

    const values = parseForm(FormValues, form);

    expect(values).toEqual({
        ob: {
            strings: ["value1", "value2"],
        },
    });
});

test("types", () => {
    const FormValues = z.object({
        value: z.string(),
        ob: z.object({
            strings: z.array(z.string()),
        }),
    });

    const fields = createFields("test", FormValues);

    assertNotAny(fields.ob);
    assertNotAny(fields.value());
    assertNotAny(fields.value("name"));
    assertNotAny(fields.value("id"));
    assertNotAny(fields.ob.strings(0));

    // @ts-expect-error
    fields.ob();

    // @ts-expect-error
    fields.value("bad");

    // @ts-expect-error
    fields.ob.strings("bad");

    // @ts-expect-error
    fields.ob.strings("id");

    // @ts-expect-error
    fields.ob.strings();

    // @ts-expect-error
    fields.ob.strings(1).nope;

    // @ts-expect-error
    fields.ob.nope;

    // @ts-expect-error
    fields.nope();

    <form>
        <input
            // @ts-expect-error
            name={fields.nope()}
        />

        <input
            // @ts-expect-error
            name={fields.ob}
        />

        <input
            // @ts-expect-error
            name={fields.ob()}
        />

        <input
            // @ts-expect-error
            name={fields.ob.strings(1)}
        />

        <input
            // @ts-expect-error
            name={fields.value}
        />
    </form>;
});
