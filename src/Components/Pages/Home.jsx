import React from 'react'
import Navbar from './Navbar'
import Slide from './Slide'
import Service from './Service'
import About from './About' 
import Team from './Team'  
import Testimonial from './Testimonial'  
import Footer from './Footer' 
import Moto from './Moto'
import Spinner from './Spinner'
import CoursesToHire from './CoursesToHire'
import HowItWorksVideo from './HowItWorksVideo'

export default function Home() {
    return (
        <>
            <Spinner/>
            <Navbar/>
            <Slide/>
            <Service/>
            <About/>
            <CoursesToHire />
            <HowItWorksVideo />
            <Moto />
            <Team/>
            <Testimonial/>
            <Footer/>  
            <a href="#" className="btn btn-primary back-to-top"><i className="bi bi-arrow-up"></i></a>
        </>
    )
}
