import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle, ChevronLeft, ChevronRight, Download, Filter, RefreshCw, Users } from 'lucide-react';
import { JiraConfig } from '../services/jira';
import { ContractorMetricsService, ContractorMetrics, MetricsFilter } from '../services/contractorMetrics';
import { PerformanceMetricCards } from '../components/charts/PerformanceMetricCards';
import ContractorPerformanceCharts from '../components/charts/ContractorPerformanceCharts';
import ContractorTaskList from '../components/dashboard/ContractorTaskList';
import ContractorComparison from '../components/dashboard/ContractorComparison';
import ContractorFilters from '../components/dashboard/ContractorFilters';

interface ContractorDashboardPageProps {
  jiraConfig: JiraConfig | null;
}

const ContractorDashboardPage: React.FC<ContractorDashboardPageProps> = ({ jiraConfig }) => {
  const navigate = useNavigate();
  const { contractorId } = useParams<{ contractorId?: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [metricsService, setMetricsService] = useState<ContractorMetricsService | null>(null);
  const [contractors, setContractors] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<string | null>(contractorId || null);
  const [contractorMetrics, setContractorMetrics] = useState<ContractorMetrics | null>(null);
  const [previousPeriodMetrics, setPreviousPeriodMetrics] = useState<ContractorMetrics | null>(null);
  const [filter, setFilter] = useState<MetricsFilter>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initService = async () => {
      if (jiraConfig) {
        try {
          setIsLoading(true);
          setError(null);
          
          // Create metrics service
          const { createContractorMetricsService } = await import('../services/contractorMetrics');
          const service = await createContractorMetricsService(jiraConfig);
          
          if (service) {
            setMetricsService(service);
            
            // Get contractors
            const contractorsList = await service.getContractors();
            setContractors(contractorsList);
            
            // Set selected contractor if not already set
            if (!selectedContractor && contractorsList.length > 0) {
              setSelectedContractor(contractorsList[0].id);
            }
          } else {
            setError('Failed to initialize contractor metrics service. Please check your Jira configuration.');
          }
        } catch (err) {
          console.error('Error initializing contractor metrics service:', err);
          setError('Error initializing contractor metrics service.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    initService();
  }, [jiraConfig]);

  useEffect(() => {
    const loadMetrics = async () => {
      if (metricsService && selectedContractor) {
        try {
          setIsLoading(true);
          setError(null);
          
          // Get current period metrics
          const metrics = await metricsService.calculateContractorMetrics(selectedContractor, filter);
          setContractorMetrics(metrics);
          
          // Get previous period metrics for comparison
          const previousStartDate = new Date(filter.startDate || '');
          const previousEndDate = new Date(filter.endDate || '');
          const periodDuration = previousEndDate.getTime() - previousStartDate.getTime();
          
          const previousPeriodStart = new Date(previousStartDate.getTime() - periodDuration);
          const previousPeriodEnd = new Date(previousEndDate.getTime() - periodDuration);
          
          const previousMetrics = await metricsService.calculateContractorMetrics(
            selectedContractor,
            {
              ...filter,
              startDate: previousPeriodStart.toISOString().split('T')[0],
              endDate: previousPeriodEnd.toISOString().split('T')[0],
            }
          );
          
          setPreviousPeriodMetrics(previousMetrics);
        } catch (err) {
          console.error('Error loading contractor metrics:', err);
          setError('Error loading contractor metrics.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadMetrics();
  }, [metricsService, selectedContractor, filter]);

  const handleContractorChange = (contractorId: string) => {
    setSelectedContractor(contractorId);
    navigate(`/contractors/${contractorId}`);
  };

  const handleFilterChange = (newFilter: Partial<MetricsFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  const handleRefresh = () => {
    if (metricsService && selectedContractor) {
      const loadMetrics = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const metrics = await metricsService.calculateContractorMetrics(selectedContractor, filter);
          setContractorMetrics(metrics);
        } catch (err) {
          console.error('Error refreshing contractor metrics:', err);
          setError('Error refreshing contractor metrics.');
        } finally {
          setIsLoading(false);
        }
      };

      loadMetrics();
    }
  };

  const handleExport = () => {
    if (!contractorMetrics) return;
    
    const dataStr = JSON.stringify(contractorMetrics, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `contractor-metrics-${selectedContractor}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!jiraConfig) {
    return (
      <AdminLayout>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Contractor Performance Dashboard</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Configured</AlertTitle>
            <AlertDescription>
              Please configure Jira integration in the API Configurations tab before using this feature.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Contractor Performance Dashboard</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={!contractorMetrics}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div className="w-full md:w-auto">
            <Select 
              value={selectedContractor || ''} 
              onValueChange={handleContractorChange}
              disabled={isLoading || contractors.length === 0}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a contractor" />
              </SelectTrigger>
              <SelectContent>
                {contractors.map(contractor => (
                  <SelectItem key={contractor.id} value={contractor.id}>
                    {contractor.name} ({contractor.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const currentIndex = contractors.findIndex(c => c.id === selectedContractor);
                if (currentIndex > 0) {
                  handleContractorChange(contractors[currentIndex - 1].id);
                }
              }}
              disabled={
                isLoading || 
                !selectedContractor || 
                contractors.findIndex(c => c.id === selectedContractor) <= 0
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const currentIndex = contractors.findIndex(c => c.id === selectedContractor);
                if (currentIndex < contractors.length - 1) {
                  handleContractorChange(contractors[currentIndex + 1].id);
                }
              }}
              disabled={
                isLoading || 
                !selectedContractor || 
                contractors.findIndex(c => c.id === selectedContractor) >= contractors.length - 1
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mb-6">
            <ContractorFilters 
              filter={filter}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
        
        {!isLoading && contractorMetrics && (
          <>
            <div className="mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{contractorMetrics.contractor.name}</CardTitle>
                      <CardDescription>
                        {contractorMetrics.contractor.role} • {contractorMetrics.contractor.email}
                      </CardDescription>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(contractorMetrics.period.startDate).toLocaleDateString()} - {new Date(contractorMetrics.period.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PerformanceMetricCards 
                    metrics={contractorMetrics.summary}
                    previousPeriodMetrics={previousPeriodMetrics?.summary}
                  />
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <ContractorPerformanceCharts metrics={contractorMetrics} />
              </TabsContent>
              
              <TabsContent value="tasks" className="mt-6">
                <ContractorTaskList tasks={contractorMetrics.tasks} />
              </TabsContent>
              
              <TabsContent value="comparison" className="mt-6">
                <ContractorComparison 
                  currentContractor={contractorMetrics}
                  previousPeriodMetrics={previousPeriodMetrics}
                  allContractors={[]}
                  onLoadAllContractors={() => {}}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
        
        {!isLoading && !contractorMetrics && selectedContractor && (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 mb-4">No metrics data available for this contractor.</p>
            <Button onClick={handleRefresh}>Refresh</Button>
          </div>
        )}
        
        {!isLoading && contractors.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No contractors found in Jira.</p>
            <Button onClick={handleRefresh}>Refresh</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ContractorDashboardPage;
