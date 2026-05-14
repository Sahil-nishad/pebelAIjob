"""
Simple test script to verify the Careers Backend API is working.

Usage:
    python test_api.py
"""

import requests
import sys

BASE_URL = "http://localhost:8000"


def test_health_check():
    """Test the root health check endpoint."""
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to {BASE_URL}. Is the server running?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_detailed_health():
    """Test the detailed health check endpoint."""
    print("\nTesting detailed health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Detailed health check passed: {data}")
            return True
        else:
            print(f"❌ Detailed health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_api_docs():
    """Test that API documentation is accessible."""
    print("\nTesting API documentation...")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print(f"✅ API docs accessible at {BASE_URL}/docs")
            return True
        else:
            print(f"❌ API docs not accessible: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_auth_endpoint():
    """Test the auth health endpoint."""
    print("\nTesting auth endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/auth/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Auth endpoint working: {data}")
            return True
        else:
            print(f"❌ Auth endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_analytics_dashboard_unauthorized():
    """Test that protected endpoints require authentication."""
    print("\nTesting authentication requirement...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/analytics/dashboard")
        if response.status_code == 401:
            print("✅ Protected endpoint correctly requires authentication")
            return True
        else:
            print(f"⚠️  Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("PebelAI Careers Backend API Test")
    print("=" * 60)
    
    tests = [
        test_health_check,
        test_detailed_health,
        test_api_docs,
        test_auth_endpoint,
        test_analytics_dashboard_unauthorized,
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed!")
        print("\nNext steps:")
        print("1. Visit http://localhost:8000/docs to see API documentation")
        print("2. Test resume upload with a real PDF file")
        print("3. Check the frontend at http://localhost:3000/careers")
        return 0
    else:
        print("❌ Some tests failed. Check the output above.")
        print("\nTroubleshooting:")
        print("1. Make sure the server is running: uvicorn app.main:app --reload")
        print("2. Check .env file has correct configuration")
        print("3. Verify DATABASE_URL and REDIS_URL are accessible")
        return 1


if __name__ == "__main__":
    sys.exit(main())
