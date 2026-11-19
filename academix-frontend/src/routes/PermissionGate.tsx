import {ReactNode} from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { usePermissionStore } from '../store/permissionStore'



type Props = {
    scopeType: "system" | "domain" | "course" | "batch" | "team",
    children:ReactNode
}

export const PermissionGate = ({scopeType,children} : Props) =>{

    const selectedPermission = usePermissionStore(s=>s.selectedPermission)

if(selectedPermission?.scope_type != scopeType ){
    <Navigate to="/c" replace/>
}

return <>
{children}
</>

}