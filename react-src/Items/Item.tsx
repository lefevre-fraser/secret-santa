import React, { useRef, useState } from 'react';
import { REGEX_NEWLINE } from '../Common/Common';
import Button, { ButtonGroup } from '../Inputs/Button';
import Form from '../Inputs/Form';
import Input, { DisplayMode } from '../Inputs/Input'

type ItemProps = { 
    mode: DisplayMode,
    item: any,
    showEdit: boolean, 
    showDelete: boolean 
};
const Item = (props: ItemProps) => {
    const [mode, setMode] = useState(props.mode || "view");
    const { item, showEdit, showDelete } = props;
    const { id, title, description } = item;
    const description_show_length = Math.max(2, Math.min(5,item.description?[...(item.description.matchAll(REGEX_NEWLINE))].length+1:0))
    const titleref = useRef(null);
    const descriptionref = useRef(null);
    const numberref = useRef(null);

    return (
        <Form>
            <Input type="number" mode="view" innerRef={numberref} hidden={false} inline={true} title="Item-ID" value={id} />
            <Input type="text" mode={mode} innerRef={titleref} hidden={false} inline={true} title="Title" value={title} />
            <Input type="textarea" mode={mode} innerRef={descriptionref} hidden={false} inline={true} title="Description" rows={description_show_length} value={description} />
            { (mode==="edit" || showEdit || showDelete) && <ButtonGroup centered={true}>
                { mode==="edit" && <Button type="button" onClick={() => setMode("view")}>Save</Button> }
                { showEdit && mode!=="edit" && <Button type="button" onClick={() => {setMode("edit")}}>Edit</Button> }
                { showDelete && <Button type="button">Delete</Button> }
            </ButtonGroup> }
        </Form>
    )
}

export default Item;