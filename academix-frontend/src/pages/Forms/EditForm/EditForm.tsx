import React from 'react'
import style from './EditForm.module.css'
import { Outlet } from 'react-router-dom'

const EditForm = () => {
  return (
    <>
    {/* <div>EditForm</div> */}
    <Outlet/>
    </>
  )
}

export default EditForm