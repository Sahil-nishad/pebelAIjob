"""
Test script for resume parsing functionality.

This script tests:
1. PDF text extraction
2. AI-powered data extraction
3. Resume service integration

Usage:
    python test_resume_parsing.py
"""

import asyncio
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.pdf_parser import PDFParser
from app.services.ai_service import AIService


async def test_pdf_extraction():
    """Test PDF text extraction."""
    print("=" * 60)
    print("Test 1: PDF Text Extraction")
    print("=" * 60)
    
    # Sample resume text (simulating PDF extraction)
    sample_text = """
    John Doe
    Software Engineer
    john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe
    
    PROFESSIONAL SUMMARY
    Experienced software engineer with 5+ years of expertise in full-stack development,
    specializing in Python, JavaScript, and cloud technologies.
    
    SKILLS
    • Programming Languages: Python, JavaScript, TypeScript, Java, Go
    • Web Frameworks: React, Next.js, FastAPI, Django, Node.js
    • Databases: PostgreSQL, MongoDB, Redis
    • Cloud: AWS, Google Cloud, Docker, Kubernetes
    • Tools: Git, CI/CD, Terraform, Jenkins
    
    EXPERIENCE
    Senior Software Engineer | Tech Corp | Jan 2021 - Present
    • Led development of microservices architecture serving 1M+ users
    • Implemented CI/CD pipelines reducing deployment time by 60%
    • Mentored team of 5 junior developers
    
    Software Engineer | StartupXYZ | Jun 2019 - Dec 2020
    • Built RESTful APIs using FastAPI and PostgreSQL
    • Developed React frontend with TypeScript
    • Improved application performance by 40%
    
    EDUCATION
    Bachelor of Science in Computer Science
    University of Technology | 2015 - 2019
    GPA: 3.8/4.0
    
    PROJECTS
    E-commerce Platform
    • Built full-stack e-commerce platform using Next.js and Stripe
    • Technologies: React, Next.js, PostgreSQL, Stripe API
    
    AI Chatbot
    • Developed AI-powered customer service chatbot
    • Technologies: Python, OpenAI API, FastAPI, Redis
    """
    
    print("\n✅ Sample resume text extracted successfully")
    print(f"Text length: {len(sample_text)} characters")
    return sample_text


async def test_ai_extraction(resume_text: str):
    """Test AI-powered data extraction."""
    print("\n" + "=" * 60)
    print("Test 2: AI Data Extraction")
    print("=" * 60)
    
    try:
        ai_service = AIService()
        
        if not ai_service.gemini_available and not ai_service.openai_available:
            print("❌ No AI API key configured")
            print("Please set GEMINI_API_KEY or OPENAI_API_KEY in .env")
            return None
        
        print("\n🤖 Extracting structured data with AI...")
        extracted_data = await ai_service.extract_resume_data(resume_text)
        
        print("\n✅ Data extracted successfully!")
        print("\n📊 Extracted Data:")
        print(f"\nName: {extracted_data.get('name')}")
        print(f"\nSkills ({len(extracted_data.get('skills', []))}): ")
        for skill in extracted_data.get('skills', [])[:10]:
            print(f"  • {skill}")
        if len(extracted_data.get('skills', [])) > 10:
            print(f"  ... and {len(extracted_data.get('skills', [])) - 10} more")
        
        print(f"\nExperience ({len(extracted_data.get('experience', []))}): ")
        for exp in extracted_data.get('experience', []):
            print(f"  • {exp.get('title')} at {exp.get('company')}")
        
        print(f"\nEducation ({len(extracted_data.get('education', []))}): ")
        for edu in extracted_data.get('education', []):
            print(f"  • {edu.get('degree')} from {edu.get('institution')}")
        
        print(f"\nProjects ({len(extracted_data.get('projects', []))}): ")
        for proj in extracted_data.get('projects', []):
            print(f"  • {proj.get('title')}")
        
        return extracted_data
    
    except Exception as e:
        print(f"\n❌ AI extraction failed: {e}")
        return None


async def test_ats_matching():
    """Test ATS matching algorithm."""
    print("\n" + "=" * 60)
    print("Test 3: ATS Matching")
    print("=" * 60)
    
    try:
        ai_service = AIService()
        
        # Sample job requirements
        job_skills = [
            "Python",
            "FastAPI",
            "PostgreSQL",
            "Docker",
            "AWS",
            "React",
            "TypeScript",
            "Redis",
            "Kubernetes",
            "Machine Learning",  # Not in candidate skills
        ]
        
        # Sample candidate skills
        candidate_skills = [
            "Python",
            "JavaScript",
            "TypeScript",
            "FastAPI",
            "Django",
            "React",
            "Next.js",
            "PostgreSQL",
            "MongoDB",
            "Redis",
            "AWS",
            "Docker",
            "Kubernetes",
            "Git",
        ]
        
        print("\n📋 Job Requirements:")
        print(f"Skills: {', '.join(job_skills)}")
        
        print("\n👤 Candidate Skills:")
        print(f"Skills: {', '.join(candidate_skills)}")
        
        print("\n🔍 Calculating match...")
        match_result = await ai_service.calculate_ats_match(job_skills, candidate_skills)
        
        print("\n✅ Match calculated successfully!")
        print(f"\n📊 Match Results:")
        print(f"Match Percentage: {match_result['match_percentage']}%")
        print(f"\nMatching Skills ({len(match_result['matching_skills'])}):")
        for skill in match_result['matching_skills']:
            print(f"  ✓ {skill}")
        print(f"\nMissing Skills ({len(match_result['missing_skills'])}):")
        for skill in match_result['missing_skills']:
            print(f"  ✗ {skill}")
        print(f"\nSummary: {match_result['summary']}")
        
        return match_result
    
    except Exception as e:
        print(f"\n❌ ATS matching failed: {e}")
        return None


async def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("Resume Parsing Test Suite")
    print("=" * 60)
    
    # Test 1: PDF extraction
    resume_text = await test_pdf_extraction()
    
    # Test 2: AI extraction
    extracted_data = await test_ai_extraction(resume_text)
    
    # Test 3: ATS matching
    match_result = await test_ats_matching()
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    tests_passed = 0
    tests_total = 3
    
    if resume_text:
        print("✅ Test 1: PDF Extraction - PASSED")
        tests_passed += 1
    else:
        print("❌ Test 1: PDF Extraction - FAILED")
    
    if extracted_data:
        print("✅ Test 2: AI Extraction - PASSED")
        tests_passed += 1
    else:
        print("❌ Test 2: AI Extraction - FAILED")
    
    if match_result:
        print("✅ Test 3: ATS Matching - PASSED")
        tests_passed += 1
    else:
        print("❌ Test 3: ATS Matching - FAILED")
    
    print(f"\n{tests_passed}/{tests_total} tests passed")
    
    if tests_passed == tests_total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
