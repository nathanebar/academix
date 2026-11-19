import React from 'react'
import style from './ShowForm.module.css'
import { Outlet } from 'react-router-dom'

const ShowForm = () => {
  return (
    <>
    {/* <div>ShowForm</div> */}
    <Outlet/>
    </>
  )
}

export default ShowForm