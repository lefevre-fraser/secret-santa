import React, { useEffect } from 'react';
import LoadingSpinner from '../Loading/LoadingSpinner';
import useFetch from '../UseFetch';
import ItemList from '../Items/ItemList';
import { useParams } from 'react-router';
import { PageProps, setTitle } from './Pages';

const Items = (props: PageProps) => {
    const { titleRef } = props;
    const { groupId, emailId } = useParams();
    // let group: any = null, group_error: any = null;
    // groupId && ({ data: group, error: group_error } = useFetch(`/api/groups/${groupId}`))
    // let user: any = null, user_error: any = null;
    // groupId && ({ data: user, error: user_error } = useFetch(`/api/${emailId?'':'current'}user${emailId?'s':''}/${emailId}`))
    const { data: group, error: group_error } = useFetch(`/api/groups/${groupId}`)
    const { data: user, error: user_error } = useFetch(`/api/${emailId?'':'current'}user${emailId?'s':''}/${emailId}`)
    
    setTitle(titleRef, () => { 
        return groupId && (group_error || user_error) ? `Error accessing group or user: ${group_error?group_error:user_error}` : `${groupId?`${group?.at(0).name} - ${user?.at(0).name?user.at(0).name:user?.at(0).email_id}`:'My'} - Items` 
    }, [group, group_error, user, user_error]);

    const items_url = `/api/${groupId?'':'my'}items/${groupId?groupId:''}/${emailId?emailId:''}`
    const { data, error, message } = useFetch(items_url, { method: "GET" })

    return (
        <>
            {(!error && !data) && <LoadingSpinner className="large" />}
            {error && <div>{error}</div>}
            {message && <div>{message}</div>}
            {data && <ItemList items={data} /> }
        </>
    );
}

export default Items;